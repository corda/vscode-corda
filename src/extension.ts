'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { LogSeverities, MessageType, WindowMessage } from "./logviewer/types";
import * as request from "./logviewer/request";
import { PathLike } from "fs";

import { CordaOperationsProvider } from './treeDataProviders/cordaOperations';
import { CordaDepProvider } from './treeDataProviders/cordaDependencies';
import { CordaFlowsProvider } from './treeDataProviders/cordaFlows';
import { CordaContractsProvider } from './treeDataProviders/cordaContracts';
import { CordaStatesProvider } from './treeDataProviders/cordaStates';
import { CordaMockNetworkProvider } from './treeDataProviders/cordaMockNetwork';

import { ClassSig, parseJavaFiles } from './typeParsing';
import { getWebViewPanel } from './panels';
import * as callbacks from './commands';
import { launchClient } from './terminals';
import { getBuildGradleFSWatcher } from './watchers';
import { cordaCheckAndLoad } from './projectUtils';
import { loginToNodes } from './nodeexplorer/login';

// TESTING
import { TestData } from './CONSTANTS';

const cordaWatchers: vscode.FileSystemWatcher[] | undefined = undefined;

/**
 * context.workSpaceState entries:
 * projectIsCorda - is the workspace a valid Corda Project, set in cordaCheckAndLoad().
 * <webviewpanels> - entry per active webview
 * deployNodesConfig - list of nodes that are configured in build.gradle
 * 
 * context.globalState entries:
 * clientToken - UUID for access to single instance of springboot client, set in cordaCheckAndLoad().
 * runningNodes - list of nodes that are currently in running state - global tracking due to port allocations
 *  */ 


/**
 * Extension entry point
 * @param context 
 */
export async function activate(context: vscode.ExtensionContext) {

	// FOR DEVELOPMENT TEST -- clear global state
	await context.globalState.update("runningNodes", undefined);

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

		launchClient(); // Launch client connector Springboot jar

		loginToNodes(context); // initiate login (if nodes are UP)
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
		vscode.commands.registerCommand('corda.Node.logViewer', () => {
			
			panelStart('logviewer', context);
			
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
		vscode.commands.registerCommand('corda.mockNetwork.networkMap', () => panelStart('networkmap', context))
	); // end context subscriptions


}

export const deactivate = () => {};

/**
 * Checks if webviews exists and shows or create with content
 * @param view : name of the view
 * @param context
 */
const panelStart = async (view: string, context: vscode.ExtensionContext) => {
	let panel: vscode.WebviewPanel | undefined = context.workspaceState.get(view);
	if (panel) {
		panel.reveal();
	}  else {
		await context.workspaceState.update(view, getWebViewPanel(view, context));
	}
}

/**
 * returns true if named terminal exists in windows
 * @param termName 
 */
const findTerminal = (termName: string) => {
	const terminals = vscode.window.terminals.filter(t => t.name == termName);
	return terminals.length !== 0 ? terminals[0] : undefined;
}