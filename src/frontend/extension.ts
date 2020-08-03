import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('cordalogviewer.showStaticWebView', () => {
			const panel = vscode.window.createWebviewPanel(
				'staticWebView', 
        		'Corda Static WebView',
        		vscode.ViewColumn.One, 
        		{} 
			);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('cordalogviewer.showLogViewer', () => {
			const panel = vscode.window.createWebviewPanel(
				'cordaLogViewer', 
        		'Corda Log Viewer', 
        		vscode.ViewColumn.One, 
        		{
					enableScripts: true,
					retainContextWhenHidden: true,
					localResourceRoots: [ vscode.Uri.file(path.join(context.extensionPath, 'out')) ]
				}
			);

			panel.webview.html = getReactLogWebViewContent(context);
		})
	);
}

const getStaticLogWebViewContent = (text: string) =>
	`<!DOCTYPE html>
	<html lang="en">
	<head> 
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>A Static Webview</title>
	</head>
	<body>
		<p>Corda, Corda, Corda</ p>
		<code>
		${text}
		</code>
		<br />
		<img src="https://miro.medium.com/max/700/1*x1_W4KVkL-jJTzV8aitoPQ.png" width="300" />
	</body>
	</html>`


const getReactLogWebViewContent = (context: any) =>
	`<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Corda Log Viewer</title>
	</head>
	<body>
		<div id="root"></div>
		${loadScript(context,path.normalize('out/') + 'index' + '.js') /* e.g /out/transactionExplorer.js */}
	</body>
	</html>`


const loadScript = (context: vscode.ExtensionContext, path: string) =>
	`<script 
		src="${vscode.Uri.file(context.asAbsolutePath(path)).with({ scheme: 'vscode-resource'}).toString()}"
	>
	</script>`;

export const deactivate = () => {};