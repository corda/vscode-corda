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

// TESTING
import { TestData } from './CONSTANTS';


const cordaWebViewPanels: { [id: string] : vscode.WebviewPanel } = {};
const cordaWatchers: vscode.FileSystemWatcher[] | undefined = undefined;

/**
 * context.workSpaceState entries:
 * projectIsCorda - is the workspace a valid Corda Project, set in cordaCheckAndLoad().
 * 
 * context.globalState entries:
 * clientToken - UUID for access to single instance of springboot client, set in cordaCheckAndLoad().
 *  */ 


/**
 * Extension entry point
 * @param context 
 */
export async function activate(context: vscode.ExtensionContext) {

	let projectObjects: {projectClasses: any, projectInterfaces:any};

	// determine Corda project and setup
	await cordaCheckAndLoad(context).then(async (result) => {
		if (!result) {
			vscode.window.setStatusBarMessage("INTERSTITIAL for Project");
			return;
		}

		projectObjects= await parseJavaFiles(context); // scan all project java files and build inventory
		// Initiate watchers
		cordaWatchers?.push(getBuildGradleFSWatcher());

		// Launch client connector Springboot jar
		launchClient();
	});

	// Corda TreeDataProviders
	const cordaOperationsProvider = new CordaOperationsProvider();
	const cordaDepProvider = new CordaDepProvider();
	const cordaFlowsProvider = new CordaFlowsProvider(projectObjects!.projectClasses.flowClasses as ClassSig[]);
	const cordaContractsProvider = new CordaContractsProvider(projectObjects!.projectClasses.contractClasses as ClassSig[]);
	const cordaStatesProvider = new CordaStatesProvider(projectObjects!.projectClasses.contractStateClasses as ClassSig[]);
	const cordaMockNetworkProvider = new CordaMockNetworkProvider(TestData.mockNetwork);

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

		// mocknetwork
		// vscode

		// refreshes
		vscode.commands.registerCommand('cordaFlows.refresh', (classSig) => cordaFlowsProvider.refresh(classSig)),
		vscode.commands.registerCommand('cordaContracts.refresh', (classSig) => cordaContractsProvider.refresh(classSig)),
		vscode.commands.registerCommand('cordaStates.refresh', (classSig) => cordaStatesProvider.refresh(classSig)),
		vscode.commands.registerCommand('corda.logViewer', () => {
			
			panelStart('logviewer', context);
			
			const filepath = path.join(context.extensionPath, "smalllog.log");
			request.countEntries(filepath).then(count => {
				cordaWebViewPanels['logviewer']?.webview.postMessage({
					messageType: MessageType.NEW_LOG_ENTRIES,
					filepath,
					entriesCount: count
				} as WindowMessage)
			})
		})
	); // end context subscriptions


}

export const deactivate = () => {};

/**
 * Checks if webviews exists and show or create with content
 * @param view : name of the view
 * @param context
 */
const panelStart = (view: string, context: vscode.ExtensionContext) => {
	let panel = cordaWebViewPanels[view];
	if (panel) {
		panel.reveal();
	}  else {
		cordaWebViewPanels[view] = getWebViewPanel(view, context);
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