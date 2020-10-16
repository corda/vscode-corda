'use strict';

import * as vscode from 'vscode';
import { window, ProgressLocation } from 'vscode';
import { CordaOperation, CordaOperationsProvider } from './treeDataProviders/cordaOperations';
import { CordaDepProvider } from './treeDataProviders/cordaDependencies';
import { CordaFlow, CordaFlowsProvider } from './treeDataProviders/cordaFlows';
import { CordaContractsProvider } from './treeDataProviders/cordaContracts';
import { CordaState, CordaStatesProvider } from './treeDataProviders/cordaStates';
import { CordaLocalNetworkProvider, DefinedCordaNodeTreeItem } from './treeDataProviders/cordaLocalNetwork';

import { ClassSig, parseJavaFiles } from './types/typeParsing';
import * as watchers from './watchers';
import * as addCommands from './commandHandlers/addCommands';
import * as general from './commandHandlers/generalCommands';
import * as network from './commandHandlers/networkCommands';
import { cordaCheckAndLoad, sleep } from './utils/projectUtils';
import { server_awake } from './commandHandlers/networkCommands';
import { Contexts, Views, Commands, GlobalStateKeys } from './types/CONSTANTS';
import { disposeRunningNodes } from './commandHandlers/networkCommands';
import { resolve } from 'dns';

const fsWatchers: any[] = [];
var projectObjects: {projectClasses: any, projectInterfaces:any};

export const debug = false;

/**
 * context.workSpaceState entries:
 * projectIsCorda - is the workspace a valid Corda Project, set in cordaCheckAndLoad().
 * <webviewpanels> - entry per active webview
 * deployNodesList - list of nodes that are configured in build.gradle
 * deployNodesBuildGradle - path to active/deployNodes build.gradle
 * areNodesDeployed (boolean) - are the nodes are currently deployed?
 * isNetworkRunning - is the local Network of THIS project running?
 * 
 * context.globalState entries:
 * isEnvCordaNet - boolean whether extension is being run locally or on ide.corda.net
 * javaExec18 - executable for JDK 1.8
 * cordaPrerequisites - boolean flag for satisfying the JDK prereqs
 * clientToken - UUID for access to single instance of springboot client, set in cordaCheckAndLoad().
 * runningNodes - list of nodes that are currently in running state - global tracking due to port allocations
 * 
 * 'when' clause contexts:
 * vscode-corda:projectIsCorda (boolean) - if the current workspace is a corda project
 * vscode-corda:areNodesDeployed (boolean) - if nodes are currently deployed
 * vscode-corda:isNetworkRunning (boolean) - if the nodes are currently running
 *  */ 


/**
 * Extension entry point
 * @param context 
 */
export async function activate(context: vscode.ExtensionContext) {
	// detect environment
	if (context.globalState.get(GlobalStateKeys.IS_ENV_CORDA_NET) === undefined) {
		const os = require('os');
		const env = (os.hostname().length == 12 && os.userInfo().username === 'coder') ? true : false;
		await context.globalState.update(GlobalStateKeys.IS_ENV_CORDA_NET, env);
	}

	// register extension first time contents and run interstitials
	context.subscriptions.push(
		vscode.commands.registerCommand(Commands.SHOW_CORDA_PREREQS, () => general.prerequisitesCallback(context))
	);
	// if (!context.globalState.get(GlobalStateKeys.CORDA_PREREQS)) { vscode.commands.executeCommand(Commands.SHOW_CORDA_PREREQS); }
	
	// check for corda deps and parse project
	if (vscode.workspace.workspaceFolders && (await cordaCheckAndLoad(context))) {
		vscode.window.setStatusBarMessage("Corda-Project");
		vscode.commands.executeCommand(Commands.SHOW_CORDA_PREREQS);
		cordaExt(context);
	} else {
		vscode.commands.executeCommand('setContext', Contexts.PROJECT_IS_CORDA_CONTEXT, false);
		context.subscriptions.push(
			vscode.commands.registerCommand(Commands.PROJECT_NEW, () => general.newProjectCallback())
		);
	}
}

/**
 * Main execution on a valid Corda Project
 * @param context 
 */
const cordaExt = async (context: vscode.ExtensionContext) => {

	// scan all project java files and build inventory for treeviews
	projectObjects = await parseJavaFiles(context); 

	// Initiate watchers
	watchers.getBuildGradleFSWatcher(context); 
	fsWatchers.push(watchers.nodesFSWatcher(context));
	watchers.activateEventListeners(context);

	// server_awake(); // launch client and check server is up

	// Corda TreeDataProviders
	const cordaOperationsProvider = new CordaOperationsProvider();
	const cordaDepProvider = new CordaDepProvider();
	const cordaFlowsProvider = new CordaFlowsProvider(projectObjects!.projectClasses.flowClasses as ClassSig[]);
	const cordaContractsProvider = new CordaContractsProvider(projectObjects!.projectClasses.contractClasses as ClassSig[]);
	const cordaStatesProvider = new CordaStatesProvider(projectObjects!.projectClasses.contractStateClasses as ClassSig[]);
	const cordaLocalNetworkProvider = new CordaLocalNetworkProvider(context);

	// Register DataProviders
	vscode.window.registerTreeDataProvider(Views.CORDA_OPERATIONS_VIEW, cordaOperationsProvider);
	vscode.window.registerTreeDataProvider(Views.CORDA_DEPENDENCIES_VIEW, cordaDepProvider);
	vscode.window.registerTreeDataProvider(Views.CORDA_FLOWS_VIEW, cordaFlowsProvider);
	vscode.window.registerTreeDataProvider(Views.CORDA_CONTRACTS_VIEW, cordaContractsProvider);
	vscode.window.registerTreeDataProvider(Views.CORDA_STATES_VIEW, cordaStatesProvider);
	vscode.window.registerTreeDataProvider(Views.CORDA_LOCALNETWORK_VIEW, cordaLocalNetworkProvider);
	
	// Register Commands

	context.subscriptions.push(
		vscode.commands.registerCommand(Commands.PROJECT_NEW, () => general.newProjectCallback()),

		// ops
		vscode.commands.registerCommand(Commands.OPERATIONS_RUN, (op: CordaOperation) => general.runGradleTaskCallback(op.taskName, op)),
		vscode.commands.registerCommand(Commands.OPERATIONS_REFRESH, (done?) => cordaOperationsProvider.refresh(done)), // done is passed from 'watchers'
		vscode.commands.registerCommand(Commands.OPERATIONS_STOP, (op: CordaOperation) => op.stopRunningTask()),

		// add classes
		vscode.commands.registerCommand(Commands.FLOWS_ADD, () => addCommands.cordaFlowsAddCallback(projectObjects)),
		vscode.commands.registerCommand(Commands.CONTRACTS_ADD, () => addCommands.cordaContractsAddCallback(projectObjects)),
		vscode.commands.registerCommand(Commands.STATES_ADD, () => addCommands.cordaContractStatesAddCallback(projectObjects)),
		vscode.commands.registerCommand(Commands.CORDA_OPEN_FILE, (uri) => general.openFileCallback(uri)),

		// linked objects
		vscode.commands.registerCommand(Commands.JUMP_TO_BOUND, (c: CordaState | CordaFlow) => {
			// fetch linked class URI
			const projectClassses = projectObjects.projectClasses;
			const combinedClasses:ClassSig[] = projectClassses.flowClasses.concat(projectClassses.contractClasses);
			const linkedClass:any = combinedClasses.find(pclass => {
				return pclass.name === c.classSig.boundTo;
			});
			if (linkedClass != undefined) {
				vscode.commands.executeCommand(Commands.CORDA_OPEN_FILE, linkedClass.file);
			}
		}),

		// refreshes : currently unused.
		vscode.commands.registerCommand(Commands.FLOWS_REFRESH, (classSig) => cordaFlowsProvider.refresh(classSig)),
		vscode.commands.registerCommand(Commands.CONTRACTS_REFRESH, (classSig) => cordaContractsProvider.refresh(classSig)),
		vscode.commands.registerCommand(Commands.STATES_REFRESH, (classSig) => cordaStatesProvider.refresh(classSig)),
		vscode.commands.registerCommand(Commands.NETWORK_REFRESH, () => cordaLocalNetworkProvider.refresh()),

		// Local Network actions
		vscode.commands.registerCommand(Commands.NETWORK_MAP_SHOW, () => network.networkMapCallback(context)),
		vscode.commands.registerCommand(Commands.NETWORK_EDIT, () => network.editDeployNodesCallback(context)),
		vscode.commands.registerCommand(Commands.NETWORK_DEPLOYNODES, async () => network.deployNodesCallback(context)),
		vscode.commands.registerCommand(Commands.NETWORK_RUN_DISABLED, () => 
			vscode.window.showInformationMessage("Network must be deployed - Deploy now?", "Yes", "No")
				.then((selection) => {
					switch (selection) {
						case "Yes":
							vscode.commands.executeCommand(Commands.NETWORK_DEPLOYNODES);
							break;
					}
				})
		),
		vscode.commands.registerCommand(Commands.NETWORK_RUN, () => {
			window.withProgress({
				location: ProgressLocation.Notification,
				title: "Running network",
				cancellable: true
			}, async (progress, token) => {
				token.onCancellationRequested(() => {
					// cancellation request here
					vscode.commands.executeCommand(Commands.NETWORK_STOP);
				});

				progress.report({increment: 0})
				
				await network.runNetworkCallback(context, progress);
				
				progress.report({increment: 10, message: "Network up"})
				await sleep(1000);
			})
			
			
		}),
		vscode.commands.registerCommand(Commands.NETWORK_STOP, () => disposeRunningNodes(context)),

		// Node actions
		vscode.commands.registerCommand(Commands.NODE_RUN_FLOW, async (node: DefinedCordaNodeTreeItem) => network.transactionsCallback(node, context)),
		vscode.commands.registerCommand(Commands.NODE_VAULT_QUERY, (node: DefinedCordaNodeTreeItem) => network.vaultqueryCallback(node, context)),
		vscode.commands.registerCommand(Commands.NODE_LOGVIEWER, async (node: DefinedCordaNodeTreeItem) => network.logviewerCallback(node, context)),
		// vscode.commands.registerCommand(Commands.NODE_LOGIN, async (node: Node) => {})
	); // end context subscriptions
}

export const deactivate = (context: vscode.ExtensionContext) => {
	disposeRunningNodes(context);
};