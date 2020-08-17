import * as vscode from 'vscode';
import * as path from 'path';
import { MessageType, WindowMessage } from "./backend/types";
import * as reader from "./backend/reader";
import { PathLike, writeFileSync } from "fs";

export function activate(context: vscode.ExtensionContext) {
	let panel: vscode.WebviewPanel | undefined = undefined;

	context.subscriptions.push(
		vscode.commands.registerCommand('cordalogviewer.showLogViewer', () => {
			if (!panel) {
				panel = vscode.window.createWebviewPanel( 
					'cordaLogViewer', 
					'Corda Log Viewer', 
					vscode.ViewColumn.One, 
					{
						enableScripts: true,
						retainContextWhenHidden: true,
						localResourceRoots: [ vscode.Uri.file(path.join(context.extensionPath, 'out/frontend')) ]
					}
				);
			}
			panel.webview.html = getReactLogWebViewContent(context);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("cordalogviewer.showAllEntries", () => {
			if (!panel) return;

			const logfile: PathLike = path.join(context.extensionPath, "smalllog.log");
			reader.countEntriesInFile(logfile).then(amount => {
				panel?.webview.postMessage(<WindowMessage> {
					messageType: MessageType.NEW_LOG_ENTRIES,
					file: logfile,
					amount
				})
			});
		})
		
	);

	/*
	context.subscriptions.push(
		vscode.commands.registerCommand("cordalogviewer.listenToChanges", () => {
			if (!panel) return;

			const logfile = path.join(context.extensionPath, "smalllog.log");
			reader.handleNewEntries(logfile, (entries: LogEntry[]) => {
				console.log("processed!");
				panel?.webview.postMessage({
					messageType: MessageType.NEW_LOG_ENTRIES,
				})
			});
		})
	);
	*/
}


const getReactLogWebViewContent = (context: vscode.ExtensionContext) =>
	`<!DOCTYPE html>
	<html lang="en"> 
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Corda Log Viewer</title>
	</head>
	<body>
		<div id="root">   </div>
		${loadScript(context,path.normalize('out/frontend/') + 'index' + '.js')}
	</body>
	</html>`


const loadScript = (context: vscode.ExtensionContext, path: string) =>
`<script 
	src="${vscode.Uri.file(context.asAbsolutePath(path)).with({ scheme: 'vscode-resource'}).toString()}"
>
</script>`;

export const deactivate = () => {};