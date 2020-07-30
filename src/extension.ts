import * as vscode from 'vscode';
import * as path from 'path';
import * as reader from "./reader";
import * as handleLogs from "./handleLogs";
import { LogEntry } from './types';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('cordalogviewer.showInfoMessage', () => {
		vscode.window.showInformationMessage(`hey`);
		const file = path.join(context.extensionPath, 'logfile.log');
		reader.lastLogEntries(file)
			.then(entries => handleLogs.groupConsecutiveEntriesBy(entries, [
				["internal.Node"],
				["changelog.ChangeSet", "jvm.JdbcExecutor"]
			])); 
	}));

	context.subscriptions.push(
		vscode.commands.registerCommand('cordalogviewer.showStaticWebView', () => {
			const panel = vscode.window.createWebviewPanel(
				'staticWebView', // Identifies the type of the webview. Used internally
        		'Corda Static WebView', // Title of the panel displayed to the user
        		vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        		{} // Webview options. More on these later.
			);
			/*linesFromFile(path.join(context.extensionPath, 'logfile.log'))
				.then((lines: Array<string>) => {
					console.log(lines.toString());
					console.log(lines[0]);
					panel.webview.html = getStaticLogWebViewContent(lines.toString())
				});
			*/
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
function getStaticLogWebViewContent(text: string) {
	return `<!DOCTYPE html>
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