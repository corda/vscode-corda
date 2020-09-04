'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { MessageType, WindowMessage } from "./logviewer/backend/types";
import * as reader from "./logviewer/backend/reader";
import { PathLike, writeFileSync } from "fs";

import { CordaTemplatesProvider } from './cordaTemplates';
import { CordaOperationsProvider } from './cordaOperations';
import { CordaDepProvider } from './cordaDependencies';
import { CordaFlowsProvider } from './cordaFlows';
import { CordaContractsProvider } from './cordaContracts';
import { CordaStatesProvider } from './cordaStates';
import { CordaToolsProvider } from './cordaTools';
import { CordaSamplesProvider } from './cordaSamples';

export function activate(context: vscode.ExtensionContext) {
	let logViewPanel: vscode.WebviewPanel | undefined = undefined;
	let nodeExplorerPanel: vscode.WebviewPanel | undefined = undefined;

	// Corda Tree
	const cordaTemplatesProvider = new CordaTemplatesProvider();
	const cordaOperationsProvider = new CordaOperationsProvider();
	const cordaDepProvider = new CordaDepProvider();
	const cordaFlowsProvider = new CordaFlowsProvider();
	const cordaContractsProvider = new CordaContractsProvider();
	const cordaStatesProvider = new CordaStatesProvider();
	const cordaToolsProvider = new CordaToolsProvider();
	const cordaSamplesProvider = new CordaSamplesProvider();

	vscode.window.registerTreeDataProvider('cordaTemplates', cordaTemplatesProvider);

	vscode.window.registerTreeDataProvider('cordaOperations', cordaOperationsProvider);
	vscode.commands.registerCommand('corda.assembleCommand', (msg) => vscode.window.showInformationMessage(msg));
	vscode.commands.registerCommand('corda.buildCommand', (msg) => vscode.window.showInformationMessage(msg));
	vscode.commands.registerCommand('corda.testCommand', (msg) => vscode.window.showInformationMessage(msg));
	vscode.commands.registerCommand('corda.cleanCommand', (msg) => vscode.window.showInformationMessage(msg));

	vscode.window.registerTreeDataProvider('cordaDependencies', cordaDepProvider);
	
	vscode.window.registerTreeDataProvider('cordaFlows', cordaFlowsProvider);
	vscode.window.registerTreeDataProvider('cordaContracts', cordaContractsProvider);
	vscode.window.registerTreeDataProvider('cordaStates', cordaStatesProvider);

	vscode.window.registerTreeDataProvider('cordaTools', cordaToolsProvider);
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
			<div id="root">   </div>
			${loadScript(context,path.normalize(subPath) + 'index' + '.js')}
		</body>
		</html>`
}

const loadScript = (context: vscode.ExtensionContext, path: string) =>
`<script 
	src="${vscode.Uri.file(context.asAbsolutePath(path)).with({ scheme: 'vscode-resource'}).toString()}"
>
</script>`;

const createLogViewPanel = (context) => {
	return vscode.window.createWebviewPanel( 
		'cordaLogViewer', 
		'Corda Log Viewer',
		vscode.ViewColumn.One, 
		{
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [ vscode.Uri.file(path.join(context.extensionPath, 'out/logviewer/frontend')) ]
		}
	)
};

const createNodeExplorerPanel = (context) => {
	return vscode.window.createWebviewPanel( 
		'cordaNodeExplorer', 
		'Corda Node Explorer', 
		vscode.ViewColumn.One, 
		{
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [ vscode.Uri.file(path.join(context.extensionPath, 'out/nodeexplorer/')) ]
		}
	);
}

export const deactivate = () => {};