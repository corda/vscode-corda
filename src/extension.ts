'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { MessageType, WindowMessage } from "./logviewer/backend/types";
import * as reader from "./logviewer/backend/reader";
import { PathLike } from "fs";

import { CordaOperationsProvider } from './treeDataProviders/cordaOperations';
import { CordaDepProvider } from './treeDataProviders/cordaDependencies';
import { CordaFlowsProvider } from './treeDataProviders/cordaFlows';
import { CordaContractsProvider } from './treeDataProviders/cordaContracts';
import { CordaStatesProvider } from './treeDataProviders/cordaStates';
import { CordaMockNetworkProvider } from './treeDataProviders/cordaMockNetwork';

import { ClassSig, parseJavaFiles } from './typeParsing';
import { createNodeExplorerPanel, createLogViewPanel, getReactPanelContent } from './panels';
import { cordaContractsAddCallback, cordaContractStatesAddCallback, cordaFlowsAddCallback, fetchTemplateOrSampleCallback } from './commands';

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
	vscode.commands.registerCommand('cordaProjects.new', () => fetchTemplateOrSampleCallback());
	vscode.commands.registerCommand('corda.operations.assembleCommand', (msg) => vscode.window.showInformationMessage(msg));
	vscode.commands.registerCommand('corda.operations.buildCommand', (msg) => vscode.window.showInformationMessage(msg));
	vscode.commands.registerCommand('corda.operations.testCommand', (msg) => vscode.window.showInformationMessage(msg));
	vscode.commands.registerCommand('corda.operations.cleanCommand', (msg) => vscode.window.showInformationMessage(msg));

	vscode.commands.registerCommand('cordaFlows.add', () => cordaFlowsAddCallback(projectObjects));
	vscode.commands.registerCommand('cordaContracts.add', () => cordaContractsAddCallback(projectObjects));
	vscode.commands.registerCommand('cordaStates.add', () => cordaContractStatesAddCallback(projectObjects));
	vscode.commands.registerCommand('corda.openFile', (uri) => {
		vscode.workspace.openTextDocument(uri).then((doc: vscode.TextDocument) => {
			vscode.window.showTextDocument(doc, {preview: false}); // open in new tab
		})
	});
	vscode.commands.registerCommand('cordaFlows.refresh', (classSig) => cordaFlowsProvider.refresh(classSig));
	vscode.commands.registerCommand('cordaContracts.refresh', (classSig) => cordaContractsProvider.refresh(classSig));
	vscode.commands.registerCommand('cordaStates.refresh', (classSig) => cordaStatesProvider.refresh(classSig));
	vscode.commands.registerCommand('corda.logViewer', () => {
		
		if (logViewPanel == undefined) logViewPanel = createLogViewPanel(context);
		logViewPanel.webview.html = getReactPanelContent('logviewer', context);
    
		const filepath: PathLike = path.join(context.extensionPath, "hugelog.log");
		
		reader.countEntriesInFile(filepath).then(amount => {
			logViewPanel?.webview.postMessage(<WindowMessage> {
				messageType: MessageType.NEW_LOG_ENTRIES,
				filepath,
				amount
			})
		});
	});
<<<<<<< HEAD
=======

	vscode.window.registerTreeDataProvider('cordaSamples', cordaSamplesProvider);

}

export const getReactPanelContent = (panel: string, context: vscode.ExtensionContext) => {
	let title: string, subPath: string;
	if (panel == 'logviewer') {
		title = "Corda Log Viewer";
		subPath = "out/logviewer/frontend/";
	} else {
		title = "Corda Node Explorer";
		subPath = "out/nodeexplorer/";
	}

	return	`<!DOCTYPE html>
		<html lang="en"> 
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>${title}</title>
		</head>
		<body>
			<div id="root"></div>
			${loadScript(context,path.normalize(subPath) + 'index' + '.js')}
		</body>
		</html>`
>>>>>>> b0f5e85... Generated object tidied up with dropdowns. Filtering doesnt work
}


export const deactivate = () => {};