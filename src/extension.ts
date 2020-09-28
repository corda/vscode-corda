'use strict';

import * as vscode from 'vscode';
import { CordaOperationsProvider } from './treeDataProviders/cordaOperations';
import { CordaDepProvider } from './treeDataProviders/cordaDependencies';
import { CordaFlowsProvider } from './treeDataProviders/cordaFlows';
import { CordaContractsProvider } from './treeDataProviders/cordaContracts';
import { CordaStatesProvider } from './treeDataProviders/cordaStates';
import { CordaMockNetworkProvider } from './treeDataProviders/cordaMockNetwork';

import { ClassSig, parseJavaFiles } from './typeParsing';
import * as watchers from './watchers';
import * as addCommands from './commandHandlers/addCommands';
import * as general from './commandHandlers/general';
import * as network from './commandHandlers/network';
import { cordaCheckAndLoad, areNodesDeployed, isNetworkRunning, disposeRunningNodes } from './projectUtils';
import { server_awake } from './nodeexplorer/serverClient';

const cordaWatchers: vscode.FileSystemWatcher[] = [];
const fsWatchers: any[] = [];
var projectObjects: {projectClasses: any, projectInterfaces:any};

/**
 * context.workSpaceState entries:
 * projectIsCorda - is the workspace a valid Corda Project, set in cordaCheckAndLoad().
 * <webviewpanels> - entry per active webview
 * deployNodesList - list of nodes that are configured in build.gradle
 * deployNodesBuildGradle - path to active/deployNodes build.gradle
 * areNodesDeployed (boolean) - are the nodes are currently deployed?
 * isNetworkRunning - is the mockNetwork of THIS project running?
 * 
 * context.globalState entries:
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
	if (vscode.workspace.workspaceFolders && (await cordaCheckAndLoad(context))) {
		vscode.window.setStatusBarMessage("Corda-Project");
		cordaExt(context);
	} else {
		vscode.commands.executeCommand('setContext', 'vscode-corda:projectIsCorda', false);
		vscode.window.showInformationMessage("Interstitial here when not Corda");
	}
}

const cordaExt = async (context: vscode.ExtensionContext) => {

	areNodesDeployed(context);
	isNetworkRunning(context);

	projectObjects = await parseJavaFiles(context); // scan all project java files and build inventory
		
	// Initiate watchers
	cordaWatchers.push(watchers.getBuildGradleFSWatcher()); 
	fsWatchers.push(watchers.nodesFSWatcher(context));
	watchers.activateEventListeners(context);

	server_awake(); // launch client and check server is up

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
		vscode.commands.registerCommand('cordaProjects.new', () => general.fetchTemplateOrSampleCallback()),

		// ops
		vscode.commands.registerCommand('corda.operations.assembleCommand', () => general.runGradleTaskCallback("assemble")),
		vscode.commands.registerCommand('corda.operations.buildCommand', () => general.runGradleTaskCallback("build")),
		vscode.commands.registerCommand('corda.operations.testCommand', () => general.runGradleTaskCallback("test")),
		vscode.commands.registerCommand('corda.operations.cleanCommand', () => general.runGradleTaskCallback("clean")),

		// add classes
		vscode.commands.registerCommand('cordaFlows.add', () => addCommands.cordaFlowsAddCallback(projectObjects)),
		vscode.commands.registerCommand('cordaContracts.add', () => addCommands.cordaContractsAddCallback(projectObjects)),
		vscode.commands.registerCommand('cordaStates.add', () => addCommands.cordaContractStatesAddCallback(projectObjects)),
		vscode.commands.registerCommand('corda.openFile', (uri) => general.openFile(uri)),

		// refreshes
		vscode.commands.registerCommand('cordaFlows.refresh', (classSig) => cordaFlowsProvider.refresh(classSig)),
		vscode.commands.registerCommand('cordaContracts.refresh', (classSig) => cordaContractsProvider.refresh(classSig)),
		vscode.commands.registerCommand('cordaStates.refresh', (classSig) => cordaStatesProvider.refresh(classSig)),

		// webviews
		vscode.commands.registerCommand('corda.Node.logViewer', async () => network.logViewer(context)),
		vscode.commands.registerCommand('corda.mockNetwork.networkMap', () => network.networkMap(context)),

		// mockNetwork actions
		vscode.commands.registerCommand('corda.mockNetwork.edit', () => network.editDeployNodes(context)),
		vscode.commands.registerCommand('corda.mockNetwork.deployNodes', async () => network.deployNodesCallBack(context)),
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
		vscode.commands.registerCommand('corda.mockNetwork.runNodes', async () => {
		
			
		}),
		vscode.commands.registerCommand('corda.mockNetwork.runNodesStop', () => {
			disposeRunningNodes(context);
		}),
		vscode.commands.registerCommand('corda.Node.runFlow', () => { 
			console.log("temp break");
		})
	); // end context subscriptions
}

export const deactivate = (context: vscode.ExtensionContext) => {
	disposeRunningNodes(context);
};