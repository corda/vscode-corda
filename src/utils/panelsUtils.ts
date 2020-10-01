import * as vscode from 'vscode';
import * as path from 'path';
import { server_awake } from '../serverClient';
import { getPrereqsContent } from '../static/prereqs';


export const getWebViewPanel = (view: string, context: vscode.ExtensionContext) => {
	let title: string, resourceRoot: string, file: string;
	let reactPanel: boolean = true;
	switch (view) {
		case 'logviewer':
			title = "Corda Log Viewer";
			resourceRoot = "out/logviewer/";
			file = "index.js"; // change this
			break;
		case 'networkmap':
			title = "Network Map";
			resourceRoot = "out/network/networkmap/";
			file = "networkmap.js";
			break;
		case 'transactions':
			title = "Transactions";
			resourceRoot = "out/network/transactions/";
			file = "transactions.js";
			break;
		case 'vaultquery':
			title = "Vault Query";
			resourceRoot = "out/network/vaultquery/";
			file = "vaultquery.js";
			break;
		case 'prerequisites':
			reactPanel = false;
			title = "Prerequisites";
			resourceRoot = "src/static/";
			file = "prereqs.js";
			break;
		default:
			title = "";
			resourceRoot = "";
			file = "";
	}
	
	let viewPanel: vscode.WebviewPanel | undefined = createViewPanel(context, view, title, resourceRoot);
	viewPanel.webview.html = (reactPanel) ? getReactPanelContent(context, title, resourceRoot, file)
				: getPrereqsContent(context, resourceRoot);
	viewPanel.onDidDispose(
		async () => {
			await context.workspaceState.update(view, "");
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
const getReactPanelContent = (context: vscode.ExtensionContext, title: string, resourceRoot: string, file: string) => {
	return	`<!DOCTYPE html>
		<html lang="en"> 
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>${title}</title>
		</head>
		<body>
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
export const panelStart = async (view: string, context: vscode.ExtensionContext) => {
	await server_awake();
	let panel: vscode.WebviewPanel | undefined = context.workspaceState.get(view);
	if (panel && panel.webview) {
		panel.reveal();
	}  else {
		await context.workspaceState.update(view, getWebViewPanel(view, context));
	}
}