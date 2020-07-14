// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "cordalogviewer" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('cordalogviewer.showInfoMessage', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('It works! This is an info message!');
	});

	context.subscriptions.push(disposable);


	context.subscriptions.push(
		vscode.commands.registerCommand('cordalogviewer.showStaticWebView', () => {
			const panel = vscode.window.createWebviewPanel(
				'staticWebView', // Identifies the type of the webview. Used internally
        		'Corda Static WebView', // Title of the panel displayed to the user
        		vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        		{} // Webview options. More on these later.
			);

			panel.webview.html = getStaticLogWebViewContent();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('cordalogviewer.showLogViewer', () => {
			const panel = vscode.window.createWebviewPanel(
				'cordaLogViewer', // Identifies the type of the webview. Used internally
        		'Corda Log Viewer', // Title of the panel displayed to the user
        		vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        		{
					enableScripts: true,
					retainContextWhenHidden: true,
					localResourceRoots: [ vscode.Uri.file(path.join(context.extensionPath, 'out')) ]
				} // Webview options. More on these later.
			);

			panel.webview.html = getReactLogWebViewContent(context);
		})
	);
}

// this function returns static content to a webview
function getStaticLogWebViewContent() {
	return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>A Static Webview</title>
	</head>
	<body>
		<p>Corda, Corda, Corda.</ p>
		<br />
		<img src="https://miro.medium.com/max/700/1*x1_W4KVkL-jJTzV8aitoPQ.png" width="300" />
	</body>
	</html>`;
}

// this function returns a React app to a webview
function getReactLogWebViewContent(context: any) {
	return `<!DOCTYPE html>
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
	</html>`;
}

/** 
 * loadScript is used to load the react files into the view html
 * @param context - Container for the extensions context
 * @param path - location of the react js files
 */
function loadScript(context: vscode.ExtensionContext, path: string) {
    return `<script src="${vscode.Uri.file(context.asAbsolutePath(path)).with({ scheme: 'vscode-resource'}).toString()}"></script>`;
}

// this method is called when your extension is deactivated
export function deactivate() {}
