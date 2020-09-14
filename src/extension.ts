'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { MessageType, WindowMessage } from "./logviewer/backend/types";
import * as reader from "./logviewer/backend/reader";
import { PathLike } from "fs";

import { CordaTemplatesProvider } from './treeDataProviders/cordaTemplates';
import { CordaOperationsProvider } from './treeDataProviders/cordaOperations';
import { CordaDepProvider } from './treeDataProviders/cordaDependencies';
import { CordaFlowsProvider } from './treeDataProviders/cordaFlows';
import { CordaContractsProvider } from './treeDataProviders/cordaContracts';
import { CordaStatesProvider } from './treeDataProviders/cordaStates';
import { CordaToolsProvider } from './treeDataProviders/cordaTools';
import { CordaSamplesProvider } from './treeDataProviders/cordaSamples';

import { ClassSig, InterfaceSig, ObjectSig, parseJavaFiles } from './typeParsing';
import { createNodeExplorerPanel, createLogViewPanel, getReactPanelContent } from './panels';
import { cordaContractsAddCallback, cordaContractStatesAddCallback, cordaFlowsAddCallback } from './commands';

// tracks all valid CorDapp objects and interfaces (Contracts, States, Flows)
// let projectClasses: {contractStateClasses:ClassSig[] | ObjectSig[], contractClasses:ClassSig[] | ObjectSig[], flowClasses:ClassSig[] | ObjectSig[]};
// let projectInterfaces: {contractStateInterfaces:InterfaceSig[] | ObjectSig[], contractInterfaces:InterfaceSig[] | ObjectSig[]};

/**
 * Constants for Inherited Corda Core Types
 */
export abstract class Constants {
    static readonly contractStateBaseInterfaces = ['ContractState', 'FungibleState', 'LinearState', 'OwnableState', 'QueryableState', 'SchedulableState'];
    static readonly contractBaseInterface = ['Contract'];
    static readonly flowBaseClass = ['FlowLogic'];
}

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
	const cordaTemplatesProvider = new CordaTemplatesProvider();
	const cordaOperationsProvider = new CordaOperationsProvider();
	const cordaDepProvider = new CordaDepProvider();
	const cordaFlowsProvider = new CordaFlowsProvider(projectObjects.projectClasses.flowClasses as ClassSig[]);
	const cordaContractsProvider = new CordaContractsProvider(projectObjects.projectClasses.contractClasses as ClassSig[]);
	const cordaStatesProvider = new CordaStatesProvider(projectObjects.projectClasses.contractStateClasses as ClassSig[]);
	const cordaToolsProvider = new CordaToolsProvider();
	const cordaSamplesProvider = new CordaSamplesProvider();

	// Register DataProviders
	vscode.window.registerTreeDataProvider('cordaTemplates', cordaTemplatesProvider);
	vscode.window.registerTreeDataProvider('cordaOperations', cordaOperationsProvider);
	vscode.window.registerTreeDataProvider('cordaDependencies', cordaDepProvider);
	vscode.window.registerTreeDataProvider('cordaFlows', cordaFlowsProvider);
	vscode.window.registerTreeDataProvider('cordaContracts', cordaContractsProvider);
	vscode.window.registerTreeDataProvider('cordaStates', cordaStatesProvider);
	vscode.window.registerTreeDataProvider('cordaTools', cordaToolsProvider);
	vscode.window.registerTreeDataProvider('cordaSamples', cordaSamplesProvider);
	
	// Register Commands
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
	vscode.commands.registerCommand('corda.nodeExplorerCommand', (panelDesc) => vscode.window.showInformationMessage(panelDesc));
	vscode.commands.registerCommand('corda.logViewerCommand', (panelDesc) => {
		
		if (logViewPanel == undefined) logViewPanel = createLogViewPanel(context);
		logViewPanel.webview.html = getReactPanelContent(panelDesc, context);
    
		const filepath: PathLike = path.join(context.extensionPath, "smalllog.log");
		
		reader.countEntriesInFile(filepath).then(amount => {
			logViewPanel?.webview.postMessage(<WindowMessage> {
				messageType: MessageType.NEW_LOG_ENTRIES,
				filepath,
				amount
			})
		});
	});
}


export const deactivate = () => {};