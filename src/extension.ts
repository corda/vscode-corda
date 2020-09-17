'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { LogSeverities, MessageType, WindowMessage } from "./logviewer/frontend/types";
import * as request from "./logviewer/frontend/request";
import { PathLike } from "fs";

import { CordaOperationsProvider } from './treeDataProviders/cordaOperations';
import { CordaDepProvider } from './treeDataProviders/cordaDependencies';
import { CordaFlowsProvider } from './treeDataProviders/cordaFlows';
import { CordaContractsProvider } from './treeDataProviders/cordaContracts';
import { CordaStatesProvider } from './treeDataProviders/cordaStates';
import { CordaMockNetworkProvider } from './treeDataProviders/cordaMockNetwork';

import { ClassSig, parseJavaFiles } from './typeParsing';
import { createNodeExplorerPanel, createLogViewPanel, getReactPanelContent } from './panels';
import * as callbacks from './commands';

// TESTING
import { TestData } from './CONSTANTS';

/**
 * Extension entry point
 * @param context 
 */
export async function activate(context: vscode.ExtensionContext) {
	const projectObjects: {projectClasses: any, projectInterfaces:any} = await parseJavaFiles(context); // scan all project java files and build inventory

	// Panels for Tools views
	let logViewPanel: vscode.WebviewPanel | undefined = undefined;
	let nodeExplorerPanel: vscode.WebviewPanel | undefined = undefined;

	// Corda TreeDataProviders
	const cordaOperationsProvider = new CordaOperationsProvider();
	const cordaDepProvider = new CordaDepProvider();
	const cordaFlowsProvider = new CordaFlowsProvider(projectObjects.projectClasses.flowClasses as ClassSig[]);
	const cordaContractsProvider = new CordaContractsProvider(projectObjects.projectClasses.contractClasses as ClassSig[]);
	const cordaStatesProvider = new CordaStatesProvider(projectObjects.projectClasses.contractStateClasses as ClassSig[]);
	const cordaMockNetworkProvider = new CordaMockNetworkProvider(TestData.mockNetwork);

	// Register DataProviders
	vscode.window.registerTreeDataProvider('cordaOperations', cordaOperationsProvider);
	vscode.window.registerTreeDataProvider('cordaDependencies', cordaDepProvider);
	vscode.window.registerTreeDataProvider('cordaFlows', cordaFlowsProvider);
	vscode.window.registerTreeDataProvider('cordaContracts', cordaContractsProvider);
	vscode.window.registerTreeDataProvider('cordaStates', cordaStatesProvider);
	vscode.window.registerTreeDataProvider('cordaMockNetwork', cordaMockNetworkProvider);
	
	// Register Commands

	vscode.commands.registerCommand('cordaProjects.new', () => callbacks.fetchTemplateOrSampleCallback());

	// ops
	vscode.commands.registerCommand('corda.operations.assembleCommand', () => callbacks.runGradleTaskCallback("assemble"));
	vscode.commands.registerCommand('corda.operations.buildCommand', () => callbacks.runGradleTaskCallback("build"));
	vscode.commands.registerCommand('corda.operations.testCommand', () => callbacks.runGradleTaskCallback("test"));
	vscode.commands.registerCommand('corda.operations.cleanCommand', () => callbacks.runGradleTaskCallback("clean"));

	// add classes
	vscode.commands.registerCommand('cordaFlows.add', () => callbacks.cordaFlowsAddCallback(projectObjects));
	vscode.commands.registerCommand('cordaContracts.add', () => callbacks.cordaContractsAddCallback(projectObjects));
	vscode.commands.registerCommand('cordaStates.add', () => callbacks.cordaContractStatesAddCallback(projectObjects));
	vscode.commands.registerCommand('corda.openFile', (uri) => callbacks.openFile(uri));

	// mocknetwork
	// vscode

	// refreshes
	vscode.commands.registerCommand('cordaFlows.refresh', (classSig) => cordaFlowsProvider.refresh(classSig));
	vscode.commands.registerCommand('cordaContracts.refresh', (classSig) => cordaContractsProvider.refresh(classSig));
	vscode.commands.registerCommand('cordaStates.refresh', (classSig) => cordaStatesProvider.refresh(classSig));
	vscode.commands.registerCommand('corda.logViewer', () => {
		
		if (logViewPanel == undefined) logViewPanel = createLogViewPanel(context);
		logViewPanel.webview.html = getReactPanelContent('logviewer', context);
    
		const filepath = path.join(context.extensionPath, "smalllog.log");
		request.countEntries(filepath).then(count => {
			logViewPanel?.webview.postMessage({
				messageType: MessageType.NEW_LOG_ENTRIES,
				filepath,
				entriesCount: count
			} as WindowMessage)
		})
	});
}


export const deactivate = () => {};

const findTerminal = (termName: string) => {
	const terminals = vscode.window.terminals.filter(t => t.name == termName);
	return terminals.length !== 0 ? terminals[0] : undefined;
}