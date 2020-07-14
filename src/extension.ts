// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

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
        		{} // Webview options. More on these later.
			);

			panel.webview.html = getReactLogWebViewContent();
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
function getReactLogWebViewContent() {
	return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Corda Log Viewer</title>
	</head>
	<body>
		<p>React Component</ p>
	</body>
	</html>`;
}

// this method is called when your extension is deactivated
export function deactivate() {}
