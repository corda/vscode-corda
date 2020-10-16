import * as vscode from 'vscode';
import * as path from 'path';
import { server_awake } from '../commandHandlers/networkCommands';
import { getWelcomeContent } from '../static/welcome';
import { GlobalStateKeys, ViewPanels, WorkStateKeys } from '../types/CONSTANTS';
import { DefinedCordaNode, PanelEntry, RunningNode, RunningNodesList } from '../types/types';
import { MessageType, WindowMessage } from '../logviewer/types';
import { logFSWatcher } from '../watchers';
import { NetworkMap } from '../network/types';
import * as requests from '../network/ext_requests';

export const getWebViewPanel = async (view: string, definedNode: DefinedCordaNode | undefined, context: vscode.ExtensionContext) => {
	let title: string, resourceRoot: string, file: string;
	let reactPanel: boolean = true;
	switch (view) {
		case ViewPanels.LOGVIEWER_PANEL:
			title = definedNode!.x500.name + " Log Viewer";
			resourceRoot = "out/logviewer/";
			file = "logviewer.js";
			break;
		case ViewPanels.NETWORKMAP_PANEL:
			title = "Network Map";
			resourceRoot = "out/network/networkmap/";
			file = "networkmap.js";
			break;
		case ViewPanels.TRANSACTIONS_PANEL:
			title = definedNode!.x500.name + " Transactions";
			resourceRoot = "out/network/transactions/";
			file = "transactions.js";
			break;
		case ViewPanels.VAULTQUERY_PANEL:
			title = definedNode!.x500.name + " Vault Query";
			resourceRoot = "out/network/vaultquery/";
			file = "vaultquery.js";
			break;
		case ViewPanels.WELCOME_PANEL:
			reactPanel = false;
			title = "Welcome to Corda";
			resourceRoot = "src/static/";
			file = "welcome.js";
			break;
		default:
			title = "";
			resourceRoot = "";
			file = "";
	}
	let viewId = view;
	if (definedNode != undefined) { viewId = view + definedNode.x500.name }
	let viewPanel: vscode.WebviewPanel | undefined = createViewPanel(context, viewId, title, resourceRoot);
	
	if (view === ViewPanels.NETWORKMAP_PANEL) {
		const networkData:NetworkMap | undefined = await requests.getNetworkMap(context);
		// wait for window.onload and push initial data
		viewPanel.webview.onDidReceiveMessage(message => {
			viewPanel!.webview.postMessage(networkData);
		})
	}

	if (view === ViewPanels.LOGVIEWER_PANEL) { // push initial logviewer content
		const os = require('os');
		const nodeLogFilename = 'node-'+ os.hostname() + '.log';
		const filepath = path.join(definedNode!.nodeDef.jarDir, 'logs', nodeLogFilename);

		// wait for window.onload and push initial data
		viewPanel.webview.onDidReceiveMessage(message => {
			viewPanel!.webview.postMessage({
				messageType: MessageType.NEW_LOG_ENTRIES,
				filepath,
			} as WindowMessage)
		})
		
		// set watcher
		logFSWatcher(definedNode!, filepath, context);
	}

	viewPanel.onDidDispose(
		async () => {
			const allPanels: PanelEntry | undefined = context.workspaceState.get(WorkStateKeys.VIEW_PANELS);
			allPanels![viewId] = undefined;
			await context.workspaceState.update(WorkStateKeys.VIEW_PANELS, allPanels);
			viewPanel = undefined;
		},
		null,
		context.subscriptions
	)

	viewPanel.webview.html = (reactPanel) ? getReactPanelContent(context, definedNode, title, resourceRoot, file)
				: getWelcomeContent(context, resourceRoot);
	
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
			${
				(title === 'Network Map' || title.includes('Log Viewer')) ? `
				<script>
					const loaded = () => {
						const vscode = acquireVsCodeApi();
						vscode.postMessage({command: 'loaded'})
					}
					window.onload = loaded;
				</script>
				` : ''
			}
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
	
	if (context.workspaceState.get(WorkStateKeys.VIEW_PANELS) === undefined) {
		await context.workspaceState.update(WorkStateKeys.VIEW_PANELS, {});
	}
	const allPanels: PanelEntry | undefined = context.workspaceState.get(WorkStateKeys.VIEW_PANELS);
	
	if (view !== ViewPanels.WELCOME_PANEL) {
		await server_awake(clientToken!, context);
	}
	let viewId = (definedNode != undefined) ? view + definedNode.x500.name : view;
	let panel: vscode.WebviewPanel | undefined = allPanels![viewId];
	if (panel && panel.webview) { // panel already exists
		panel.reveal();
	}  else { // create panel
		const newPanel = await getWebViewPanel(view, definedNode, context);
		allPanels![viewId] = newPanel;
		await context.workspaceState.update(WorkStateKeys.VIEW_PANELS, allPanels);
	}
}