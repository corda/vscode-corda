'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { MessageType, WindowMessage } from "./logviewer/types";

import * as request from "./logviewer/request";
import { CordaOperationsProvider } from './treeDataProviders/cordaOperations';
import { CordaDepProvider } from './treeDataProviders/cordaDependencies';
import { CordaFlowsProvider } from './treeDataProviders/cordaFlows';
import { CordaContractsProvider } from './treeDataProviders/cordaContracts';
import { CordaStatesProvider } from './treeDataProviders/cordaStates';
import { CordaMockNetworkProvider } from './treeDataProviders/cordaMockNetwork';

import { ClassSig, parseJavaFiles } from './typeParsing';
import { panelStart } from './panels';
import * as callbacks from './commands';
import { getBuildGradleFSWatcher } from './watchers';
import { cordaCheckAndLoad, areNodesDeployed, isNetworkRunning } from './projectUtils';
import { loginToNodes } from './nodeexplorer/serverClient';
import { WorkStateKeys, GlobalStateKeys } from './CONSTANTS';
import { server_awake } from './nodeexplorer/serverClient';

const cordaWatchers: vscode.FileSystemWatcher[] | undefined = undefined;

/**
 * context.workSpaceState entries:
 * projectIsCorda - is the workspace a valid Corda Project, set in cordaCheckAndLoad().
 * <webviewpanels> - entry per active webview
 * deployNodesList - list of nodes that are configured in build.gradle
 * deployNodesBuildGradle - path to active/deployNodes build.gradle
 * nodesDeployed (boolean) - are the nodes are currently deployed?
 * isNetworkRunning - is the mockNetwork running?
 * 
 * context.globalState entries:
 * clientToken - UUID for access to single instance of springboot client, set in cordaCheckAndLoad().
 * runningNodes - list of nodes that are currently in running state - global tracking due to port allocations
 * 
 * 'when' clause contexts:
 * vscode-corda:nodesDeployed (boolean) - if nodes are currently deployed
 * vscode-corda:networkRunning (boolean) - if the nodes are currently running
 *  */ 


/**
 * Extension entry point
 * @param context 
 */
export async function activate(context: vscode.ExtensionContext) {

	areNodesDeployed(context);
	isNetworkRunning(context);

	// FOR DEVELOPMENT TEST -- clear global state
	await context.globalState.update(GlobalStateKeys.RUNNING_NODES, undefined);

	let projectObjects: {projectClasses: any, projectInterfaces:any};

	// determine Corda project and setup
	await cordaCheckAndLoad(context).then(async (result) => {
		if (!result) {
			vscode.window.setStatusBarMessage("INTERSTITIAL for Project");
			return;
		}

		vscode.window.setStatusBarMessage("Corda-Project"); // identify project as Corda

		projectObjects= await parseJavaFiles(context); // scan all project java files and build inventory
		
		cordaWatchers?.push(getBuildGradleFSWatcher()); // Initiate watchers

		server_awake(); // wait up server and launch client
	});

	// Corda TreeDataProviders
	const cordaOperationsProvider = new CordaOperationsProvider();
	const cordaDepProvider = new CordaDepProvider();
	const cordaFlowsProvider = new CordaFlowsProvider(projectObjects!.projectClasses.flowClasses as ClassSig[]);
	const cordaContractsProvider = new CordaContractsProvider(projectObjects!.projectClasses.contractClasses as ClassSig[]);
	const cordaStatesProvider = new CordaStatesProvider(projectObjects!.projectClasses.contractStateClasses as ClassSig[]);
	const cordaMockNetworkProvider = new CordaMockNetworkProvider(context);

	// Register DataProviders
	vscode.window.registerTreeDataProvider('cordaOperations', cordaOperationsProvider);
	vscode.window.registerTreeDataProvider('cordaDependencies', cordaDepProvider);
	vscode.window.registerTreeDataProvider('cordaFlows', cordaFlowsProvider);
	vscode.window.registerTreeDataProvider('cordaContracts', cordaContractsProvider);
	vscode.window.registerTreeDataProvider('cordaStates', cordaStatesProvider);
	vscode.window.registerTreeDataProvider('cordaMockNetwork', cordaMockNetworkProvider);
	
	// Register Commands

	context.subscriptions.push(
		vscode.commands.registerCommand('cordaProjects.new', () => callbacks.fetchTemplateOrSampleCallback()),

		// ops
		vscode.commands.registerCommand('corda.operations.assembleCommand', () => callbacks.runGradleTaskCallback("assemble")),
		vscode.commands.registerCommand('corda.operations.buildCommand', () => callbacks.runGradleTaskCallback("build")),
		vscode.commands.registerCommand('corda.operations.testCommand', () => callbacks.runGradleTaskCallback("test")),
		vscode.commands.registerCommand('corda.operations.cleanCommand', () => callbacks.runGradleTaskCallback("clean")),

		// add classes
		vscode.commands.registerCommand('cordaFlows.add', () => callbacks.cordaFlowsAddCallback(projectObjects)),
		vscode.commands.registerCommand('cordaContracts.add', () => callbacks.cordaContractsAddCallback(projectObjects)),
		vscode.commands.registerCommand('cordaStates.add', () => callbacks.cordaContractStatesAddCallback(projectObjects)),
		vscode.commands.registerCommand('corda.openFile', (uri) => callbacks.openFile(uri)),

		// refreshes
		vscode.commands.registerCommand('cordaFlows.refresh', (classSig) => cordaFlowsProvider.refresh(classSig)),
		vscode.commands.registerCommand('cordaContracts.refresh', (classSig) => cordaContractsProvider.refresh(classSig)),
		vscode.commands.registerCommand('cordaStates.refresh', (classSig) => cordaStatesProvider.refresh(classSig)),

		// webviews
		vscode.commands.registerCommand('corda.Node.logViewer', async () => {
			await panelStart('logviewer', context);

			const filepath = path.join(context.extensionPath, "smalllog.log");
			request.countEntries(filepath).then(count => {
				let panel: vscode.WebviewPanel | undefined = context.workspaceState.get('logviewer');
				panel?.webview.postMessage({
					messageType: MessageType.NEW_LOG_ENTRIES,
					filepath,
					entriesCount: count
				} as WindowMessage)
			})
		}),

		// mockNetwork actions
		vscode.commands.registerCommand('corda.mockNetwork.networkMap', () => panelStart('networkmap', context)),
		vscode.commands.registerCommand('corda.mockNetwork.edit', () => {
			const buildGradleFile: string | undefined = context.workspaceState.get(WorkStateKeys.DEPLOY_NODES_BUILD_GRADLE);
			callbacks.openFile(vscode.Uri.parse(buildGradleFile!));
			vscode.window.showInformationMessage("Configure your network in the deployNodes task.");
			// TODO: set the cursor on the deployNodes Task
		}),
		vscode.commands.registerCommand('corda.mockNetwork.deployNodes', async () => {
			callbacks.deployNodesCallBack(context).then(() => {
				cordaMockNetworkProvider.refresh(); // refresh the MockNetworkProvider to update actions
			});
		}),
		vscode.commands.registerCommand('corda.mockNetwork.runNodesDisabled', () => 
			vscode.window.showInformationMessage("Network must be deployed - Deploy now?", "Yes", "No")
				.then((selection) => {
					switch (selection) {
						case "Yes":
							vscode.commands.executeCommand('corda.mockNetwork.deployNodes');
							break;
					}
				})
		),
		vscode.commands.registerCommand('corda.mockNetwork.runNodes', () => {
			let deployed
		}),
		vscode.commands.registerCommand('corda.mockNetwork.runNodesStop', () => {})
	); // end context subscriptions


	// WATCHER ON BUILD/NODES for updating deployment

}

export const deactivate = () => {};