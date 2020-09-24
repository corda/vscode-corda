import * as vscode from 'vscode';
import * as path from 'path';


export const getWebViewPanel = (view: string, context: vscode.ExtensionContext) => {
	let title: string, resourceRoot: string, file: string;
	
	switch (view) {
		case 'logviewer':
			title = "Corda Log Viewer";
			resourceRoot = "out/logviewer/";
			file = "index.js"; // change this
			break;
		case 'networkmap':
			title = "Network Map";
			resourceRoot = "out/nodeexplorer/";
			file = "networkmap.js";
			break;
		default:
			title = "";
			resourceRoot = "";
			file = "";
	}
	
	let logViewPanel: vscode.WebviewPanel | undefined = createViewPanel(context, view, title, resourceRoot);
	logViewPanel.webview.html = getReactPanelContent(context, title, resourceRoot, file);
	logViewPanel.onDidDispose(
		async () => {
			await context.workspaceState.update(view, "");
			logViewPanel = undefined;
		},
		null,
		context.subscriptions
	)
	return logViewPanel;
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