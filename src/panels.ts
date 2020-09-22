import * as vscode from 'vscode';
import * as path from 'path';

/**
 * 
 * @param context extension context for accessing window
 */
export const createLogViewPanel = (context) => {
	return vscode.window.createWebviewPanel( 
		'cordaLogViewer', 
		'Corda Log Viewer',
		vscode.ViewColumn.One, 
		{
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [ vscode.Uri.file(path.join(context.extensionPath, 'out/logviewer')) ]
		}
	)
};

/**
 * 
 * @param context extension context for accessing window
 */
export const createNodeExplorerPanel = (context) => {
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

/**
 * Minimal html for panel content with embedding script
 * @param panel 
 * @param context 
 */
export const getReactPanelContent = (panel: string, context: vscode.ExtensionContext) => {
	let title: string, subPath: string;
	if (panel == 'logviewer') {
		title = "Corda Log Viewer";
		subPath = "out/logviewer/";
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