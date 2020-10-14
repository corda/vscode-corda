import * as vscode from 'vscode';
import * as path from 'path';
import { server_awake } from '../commandHandlers/networkCommands';
import { getPrereqsContent } from '../static/prereqs';
import { Constants, GlobalStateKeys, WorkStateKeys } from '../types/CONSTANTS';
import { DefinedCordaNode, RunningNode, RunningNodesList } from '../types/types';
import { MessageType, WindowMessage } from '../logviewer/types';


export const getWebViewPanel = (view: string, definedNode: DefinedCordaNode | undefined, context: vscode.ExtensionContext) => {
	let title: string, resourceRoot: string, file: string;
	let reactPanel: boolean = true;
	switch (view) {
		case 'logviewer':
			title = definedNode!.x500.name + " Log Viewer";
			resourceRoot = "out/logviewer/";
			file = "index.js"; // change this
			break;
		case 'networkmap':
			title = "Network Map";
			resourceRoot = "out/network/networkmap/";
			file = "networkmap.js";
			break;
		case 'transactions':
			title = definedNode!.x500.name + " Transactions";
			resourceRoot = "out/network/transactions/";
			file = "transactions.js";
			break;
		case 'vaultquery':
			title = definedNode!.x500.name + " Vault Query";
			resourceRoot = "out/network/vaultquery/";
			file = "vaultquery.js";
			break;
		case 'prerequisites':
			reactPanel = false;
			title = "Welcome to Corda";
			resourceRoot = "src/static/";
			file = "prereqs.js";
			break;
		default:
			title = "";
			resourceRoot = "";
			file = "";
	}
	let viewId = view;
	if (definedNode != undefined) { viewId = view + definedNode.x500.name }
	let viewPanel: vscode.WebviewPanel | undefined = createViewPanel(context, viewId, title, resourceRoot);
	viewPanel.webview.html = (reactPanel) ? getReactPanelContent(context, definedNode, title, resourceRoot, file)
				: getPrereqsContent(context, resourceRoot);
	viewPanel.onDidDispose(
		async () => {
			await context.workspaceState.update(viewId, "");
			viewPanel = undefined;
		},
		null,
		context.subscriptions
	)
	return viewPanel;
}

/**
 * 
 * @param context extension context for accessing window
 */
const createViewPanel = (context, view, title, resourceRoot) => {
	return vscode.window.createWebviewPanel( 
		view, 
		title,
		vscode.ViewColumn.One, 
		{
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [ vscode.Uri.file(path.join(context.extensionPath, resourceRoot)) ]
		}
	)
};

/**
 * Minimal html for panel content with embedding script
 * @param panel 
 * @param context 
 */
const getReactPanelContent = (context: vscode.ExtensionContext, definedNode: DefinedCordaNode | undefined, title: string, resourceRoot: string, file: string) => {
	const clientToken: string | undefined = context.globalState.get(GlobalStateKeys.CLIENT_TOKEN);
	const globalRunningNodes:RunningNodesList | undefined = context.globalState.get(GlobalStateKeys.RUNNING_NODES);
	const runningNodes:RunningNode[] = globalRunningNodes![vscode.workspace.name!].runningNodes;
	var rpcClientId: string = "";
	if (definedNode !== undefined) {
		rpcClientId = runningNodes.find((node) => {
			return node.idx500 === definedNode!.idx500;
		})?.rpcconnid!;
	}
	
	return	`<!DOCTYPE html>
		<html lang="en"> 
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>${title}</title>
		</head>
		<body style="background: var(--vscode-editor-background)">
			<div id="clienttoken" style="display:none">${clientToken}</div>
			<div id="rpcconnid" style="display:none">${rpcClientId}</div>
			<div id="root">   </div>
			${loadScript(context,path.normalize(resourceRoot) + file)}
		</body>
		</html>`
}

const loadScript = (context: vscode.ExtensionContext, path: string) =>
`<script 
	src="${vscode.Uri.file(context.asAbsolutePath(path)).with({ scheme: 'vscode-resource'}).toString()}"
>
</script>`;


/**
 * Checks if webviews exists and shows or create with content
 * @param view : name of the view
 * @param context
 */
export const panelStart = async (view: string, definedNode: DefinedCordaNode | undefined, context: vscode.ExtensionContext) => {
	const clientToken:string | undefined = context.globalState.get(GlobalStateKeys.CLIENT_TOKEN);
	if (view !== 'prerequisites') {
		await server_awake(clientToken!, context);
	}
	let viewId = (definedNode != undefined) ? view + definedNode.x500.name : view;
	let panel: vscode.WebviewPanel | undefined = context.workspaceState.get(viewId);
	if (panel && panel.webview) { // panel already exists
		panel.reveal();
	}  else { // create panel
		let newPanel = getWebViewPanel(view, definedNode, context);
		if (view === 'logviewer') { // push initial logviewer content
			const os = require('os');
			const filepath = path.join(definedNode!.nodeDef.jarDir, 'logs', 'node-'+ os.hostname() + '.log');
			// let panel: vscode.WebviewPanel | undefined = context.workspaceState.get('logviewer'+node.x500.name);
			newPanel.webview.postMessage({
				messageType: MessageType.NEW_LOG_ENTRIES,
				filepath,
			} as WindowMessage)
		}
		await context.workspaceState.update(viewId, newPanel);
	}
}