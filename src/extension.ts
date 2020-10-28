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
import { disposeRunningNodes, localOrCordaNet } from './utils/stateUtils';
import { Contexts, TreeViews, Commands, GlobalStateKeys, WorkStateKeys } from './types/CONSTANTS';
import { DefinedCordaNode } from './types/types';
import { terminalIsOpenForNode } from './utils/terminalUtils';

const fsWatchers: any[] = [];
// var projectObjects: {projectClasses: any, projectInterfaces:any};

export const debug = false;

/**
 * context.workSpaceState entries:
 * 
 * projectIsCorda - is the workspace a valid Corda Project, set in cordaCheckAndLoad().
 * viewPanels - <webviewpanels> - entry per active webview
 * deployNodesList - list of nodes that are configured in build.gradle
 * deployNodesBuildGradle - path to active/deployNodes build.gradle
 * areNodesDeployed (boolean) - are the nodes are currently deployed?
 * isNetworkRunning - is the local Network of THIS project running?
 * projectObjects - dictionary of current project classes for Flow/Contract/ContractState views/ops
 * deploymentDirty - (boolean) - persistent; build.gradle definition has changed since last deployment
 * 
 * context.globalState entries:
 * 
 * isEnvCordaNet - boolean whether extension is being run locally or on ide.corda.net
 * javaExec18 - executable for JDK 1.8
 * cordaPrerequisites - boolean flag for satisfying the JDK prereqs
 * clientToken - UUID for access to single instance of springboot client, set in cordaCheckAndLoad().
 * runningNodes - list of nodes that are currently in running state - global tracking due to port allocations
 * 
 * 'when' clause contexts:
 * 
 * vscode-corda:projectIsCorda (boolean) - if the current workspace is a corda project
 * vscode-corda:areNodesDeployed (boolean) - if nodes are currently deployed
 * vscode-corda:isNetworkRunning (boolean) - if the nodes are currently running
 *  */ 


/**
 * Extension entry point
 * @param context 
 */
export async function activate(context: vscode.ExtensionContext) {
	// detect extension environment
	await localOrCordaNet(context);

	// register extension first time contents and run interstitials
	// TODO check configuration for DISMISS flag of welcome
	context.subscriptions.push(
		vscode.commands.registerCommand(Commands.SHOW_CORDA_WELCOME, () => general.welcomeCallback(context))
	);
	
	// check for corda deps and parse project
	if (vscode.workspace.workspaceFolders && (await cordaCheckAndLoad(context))) {
		vscode.window.setStatusBarMessage("Corda-Project");
		vscode.commands.executeCommand(Commands.SHOW_CORDA_WELCOME);
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

	// scan all project java files and build inventory for treeviews - commit to workspacestate
	await parseJavaFiles(context); 

	// Initiate watchers
	watchers.buildGradleFSWatcher(context);
	fsWatchers.push(watchers.nodesFSWatcher(context));
	watchers.activateEventListeners(context);
	watchers.javaClassFSWatcher(context);

	// Corda TreeDataProviders
	const cordaOperationsProvider = new CordaOperationsProvider();
	const cordaDepProvider = new CordaDepProvider();
	const cordaFlowsProvider = new CordaFlowsProvider(context);
	const cordaContractsProvider = new CordaContractsProvider(context);
	const cordaStatesProvider = new CordaStatesProvider(context);
	const cordaLocalNetworkProvider = new CordaLocalNetworkProvider(context);

	// Register DataProviders
	vscode.window.registerTreeDataProvider(TreeViews.CORDA_OPERATIONS_TREEVIEW, cordaOperationsProvider);
	vscode.window.registerTreeDataProvider(TreeViews.CORDA_DEPENDENCIES_TREEVIEW, cordaDepProvider);
	vscode.window.registerTreeDataProvider(TreeViews.CORDA_FLOWS_TREEVIEW, cordaFlowsProvider);
	vscode.window.registerTreeDataProvider(TreeViews.CORDA_CONTRACTS_TREEVIEW, cordaContractsProvider);
	vscode.window.registerTreeDataProvider(TreeViews.CORDA_STATES_TREEVIEW, cordaStatesProvider);
	vscode.window.registerTreeDataProvider(TreeViews.CORDA_LOCALNETWORK_TREEVIEW, cordaLocalNetworkProvider);
	
	// Register Commands

	context.subscriptions.push(
		vscode.commands.registerCommand(Commands.PROJECT_NEW, () => general.newProjectCallback()),

		// ops
		vscode.commands.registerCommand(Commands.OPERATIONS_RUN, (op: CordaOperation) => general.runGradleTaskCallback(op.taskName, op)),
		vscode.commands.registerCommand(Commands.OPERATIONS_REFRESH, (done?) => cordaOperationsProvider.refresh(done)), // done is passed from 'watchers'
		vscode.commands.registerCommand(Commands.OPERATIONS_STOP, (op: CordaOperation) => op.stopRunningTask()),

		// add classes
		vscode.commands.registerCommand(Commands.FLOWS_ADD, () => addCommands.cordaFlowsAddCallback(context)),
		vscode.commands.registerCommand(Commands.CONTRACTS_ADD, () => addCommands.cordaContractsAddCallback(context)),
		vscode.commands.registerCommand(Commands.STATES_ADD, () => addCommands.cordaContractStatesAddCallback(context)),
		vscode.commands.registerCommand(Commands.CORDA_OPEN_FILE, (uri) => general.openFileCallback(uri)),

		// linked objects
		vscode.commands.registerCommand(Commands.JUMP_TO_BOUND, (c: CordaState | CordaFlow) => {
			// fetch linked class URI
			const projectObjects:{projectClasses: any, projectInterfaces:any} | undefined = context.workspaceState.get(WorkStateKeys.PROJECT_OBJECTS);
			const projectClassses = projectObjects?.projectClasses;
			const combinedClasses:ClassSig[] = projectClassses.flowClasses.concat(projectClassses.contractClasses);
			const linkedClass:any = combinedClasses.find(pclass => {
				return pclass.name === c.classSig.boundTo;
			});
			if (linkedClass != undefined) {
				vscode.commands.executeCommand(Commands.CORDA_OPEN_FILE, linkedClass.file);
			}
		}),

		// refreshes.
		vscode.commands.registerCommand(Commands.REFRESH_ALL_CLASS_TREES, () => {
			vscode.commands.executeCommand(Commands.STATES_REFRESH);
			vscode.commands.executeCommand(Commands.CONTRACTS_REFRESH);
			vscode.commands.executeCommand(Commands.FLOWS_REFRESH);
		}),
		vscode.commands.registerCommand(Commands.FLOWS_REFRESH, () => cordaFlowsProvider.refresh()),
		vscode.commands.registerCommand(Commands.CONTRACTS_REFRESH, () => cordaContractsProvider.refresh()),
		vscode.commands.registerCommand(Commands.STATES_REFRESH, () => cordaStatesProvider.refresh()),
		vscode.commands.registerCommand(Commands.NETWORK_REFRESH, () => cordaLocalNetworkProvider.refresh()),


		// Local Network actions
		vscode.commands.registerCommand(Commands.NETWORK_MAP_SHOW, () => network.networkMapCallback(context)),
		vscode.commands.registerCommand(Commands.NETWORK_EDIT, () => network.editDeployNodesCallback(context)),
		vscode.commands.registerCommand(Commands.NETWORK_DEPLOYNODES, async (forceDeploy?) => network.deployNodesCallback(context, forceDeploy)),
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
				token.onCancellationRequested(async () => {
					// cancellation request here
					await vscode.commands.executeCommand(Commands.NETWORK_STOP);
					const localDefinedNodes: DefinedCordaNode[] | undefined = context.workspaceState.get(WorkStateKeys.DEPLOY_NODES_LIST);
					if (localDefinedNodes) { // clean up terminals from cancellation token
						localDefinedNodes.map(value => {
							terminalIsOpenForNode(value, true);
						})
					}
				});

				progress.report({increment: 0})
				
				await network.runNetworkCallback(context, progress);
				
				progress.report({increment: 10, message: "Network up"})
				await sleep(1000);
			})
			
			
		}),
		vscode.commands.registerCommand(Commands.NETWORK_STOP, async () => {
			await disposeRunningNodes(context);
			await vscode.commands.executeCommand(Commands.NETWORK_REFRESH);
		}),

		// Node actions
		vscode.commands.registerCommand(Commands.NODE_RUN_FLOW, async (node: DefinedCordaNodeTreeItem) => network.transactionsCallback(node, context)),
		vscode.commands.registerCommand(Commands.NODE_VAULT_QUERY, (node: DefinedCordaNodeTreeItem) => network.vaultqueryCallback(node, context)),
		vscode.commands.registerCommand(Commands.NODE_LOGVIEWER, async (node: DefinedCordaNodeTreeItem) => network.logviewerCallback(node, context)),
	); // end context subscriptions
}

export const deactivate = (context: vscode.ExtensionContext) => {
	disposeRunningNodes(context);
};

export const refreshClassViews = async (context: vscode.ExtensionContext) => {
	await parseJavaFiles(context);
    await vscode.commands.executeCommand(Commands.REFRESH_ALL_CLASS_TREES);
}