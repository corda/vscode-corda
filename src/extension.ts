'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { MessageType, WindowMessage } from "./logviewer/backend/types";
import * as reader from "./logviewer/backend/reader";
import { PathLike } from "fs";
import Axios, * as axios from 'axios';

import { CordaTemplatesProvider } from './cordaTemplates';
import { CordaOperationsProvider } from './cordaOperations';
import { CordaDepProvider } from './cordaDependencies';
import { CordaFlowsProvider } from './cordaFlows';
import { CordaContractsProvider } from './cordaContracts';
import { CordaStatesProvider } from './cordaStates';
import { CordaToolsProvider } from './cordaTools';
import { CordaSamplesProvider } from './cordaSamples';

import { ClassSig, parseJavaFiles } from './typeParsing';

export async function activate(context: vscode.ExtensionContext) {
	let {contractStateTypes, contractTypes, flowTypes} = await parseJavaFiles(context); // destructure

	let logViewPanel: vscode.WebviewPanel | undefined = undefined;
	let nodeExplorerPanel: vscode.WebviewPanel | undefined = undefined;

	// Corda Tree
	const cordaTemplatesProvider = new CordaTemplatesProvider();
	const cordaOperationsProvider = new CordaOperationsProvider();
	const cordaDepProvider = new CordaDepProvider();
	const cordaFlowsProvider = new CordaFlowsProvider(flowTypes);
	const cordaContractsProvider = new CordaContractsProvider(contractTypes);
	const cordaStatesProvider = new CordaStatesProvider(contractStateTypes);
	const cordaToolsProvider = new CordaToolsProvider();
	const cordaSamplesProvider = new CordaSamplesProvider();

	vscode.window.registerTreeDataProvider('cordaTemplates', cordaTemplatesProvider);

	vscode.window.registerTreeDataProvider('cordaOperations', cordaOperationsProvider);
	vscode.commands.registerCommand('corda.operations.assembleCommand', (msg) => vscode.window.showInformationMessage(msg));
	vscode.commands.registerCommand('corda.operations.buildCommand', (msg) => vscode.window.showInformationMessage(msg));
	vscode.commands.registerCommand('corda.operations.testCommand', (msg) => vscode.window.showInformationMessage(msg));
	vscode.commands.registerCommand('corda.operations.cleanCommand', (msg) => vscode.window.showInformationMessage(msg));

	vscode.window.registerTreeDataProvider('cordaDependencies', cordaDepProvider);
	
	vscode.window.registerTreeDataProvider('cordaFlows', cordaFlowsProvider);
	vscode.window.registerTreeDataProvider('cordaContracts', cordaContractsProvider);
	vscode.window.registerTreeDataProvider('cordaStates', cordaStatesProvider);
	
	vscode.commands.registerCommand('cordaFlows.add', () => {
	
		const qpickItems = ['FlowLogic'];
		const qpickPlaceHolder = 'Choose a parent flow class';
		const inputPlaceHolder = 'Enter the name of the flow';
		const commandSource = 'cordaFlows';
		const sourceMap = {'FlowLogic':'https://raw.githubusercontent.com/corda/vscode-corda/v0.2.0/resources/BaseFlow.java'};

		addCommandHelper(qpickItems, qpickPlaceHolder, inputPlaceHolder, commandSource, sourceMap);
	});

	vscode.commands.registerCommand('cordaContracts.add', () => {
	
		const qpickItems = ['Contract'];
		const qpickPlaceHolder = 'Choose a parent contract class';
		const inputPlaceHolder = 'Enter the name of the contract';
		const commandSource = 'cordaContracts';
		const sourceMap = {'Contract':'https://raw.githubusercontent.com/corda/vscode-corda/v0.2.0/resources/BaseContract.java'};

		addCommandHelper(qpickItems, qpickPlaceHolder, inputPlaceHolder, commandSource, sourceMap);
	});
	
	vscode.commands.registerCommand('cordaStates.add', async () => {
		const qpickItems = ['ContractState', 'FungibleState', 'LinearState', 'OwnableState', 'QueryableState', 'SchedulableState'];
		const qpickPlaceHolder = 'Choose a parent state class';
		const inputPlaceHolder = 'Enter the name of the state';
		const commandSource = 'cordaStates';
		const sourceMap = {'ContractState':'https://raw.githubusercontent.com/corda/vscode-corda/v0.2.0/resources/BaseContractState.java'};

		addCommandHelper(qpickItems, qpickPlaceHolder, inputPlaceHolder, commandSource, sourceMap);
	});



	vscode.commands.registerCommand('corda.openFile', (uri) => {
		vscode.workspace.openTextDocument(uri).then((doc: vscode.TextDocument) => {
			vscode.window.showTextDocument(doc, {preview: false}); // open in new tab
		})
	});

	vscode.commands.registerCommand('cordaFlows.refresh', (classSig) => cordaFlowsProvider.refresh(classSig));
	vscode.commands.registerCommand('cordaContracts.refresh', (classSig) => cordaContractsProvider.refresh(classSig));
	vscode.commands.registerCommand('cordaStates.refresh', (classSig) => cordaStatesProvider.refresh(classSig));


	vscode.window.registerTreeDataProvider('cordaTools', cordaToolsProvider);
	vscode.commands.registerCommand('corda.nodeExplorerCommand', (panelDesc) => vscode.window.showInformationMessage(panelDesc));
	vscode.commands.registerCommand('corda.logViewerCommand', (panelDesc) => {
		
		if (logViewPanel == undefined) logViewPanel = createLogViewPanel(context);
		logViewPanel.webview.html = getReactPanelContent(panelDesc, context);
    
		const filepath: PathLike = path.join(context.extensionPath, "smalllog.log");
		
		reader.countEntriesInFile(filepath).then(amount => {
			logViewPanel?.webview.postMessage(<WindowMessage> {
				messageType: MessageType.NEW_LOG_ENTRIES,
				filepath,
				amount
			})
		});
	});

	vscode.window.registerTreeDataProvider('cordaSamples', cordaSamplesProvider);

}

const addCommandHelper = async (qpickItems, qpickPlaceHolder, inputPlaceHolder, commandSource, sourceMap) => {
	let result: vscode.Uri[] | undefined = await vscode.window.showOpenDialog({canSelectFiles: false, canSelectFolders: true, filters: {'Java': ['java']}});
	let stateBase = await vscode.window.showQuickPick(qpickItems,
	{
		placeHolder: qpickPlaceHolder
	});
	let fileName = await vscode.window.showInputBox({
		placeHolder: inputPlaceHolder,
		validateInput: text => {
			return undefined;
			// must start with capital
			// must have valid chars
			// if not .java, append suffix.
		}
	}).then(name => { return (name?.includes('.java') ? name : name + '.java') }); // append .java if needed

	// check stateBase / http mapping to fetch correct template
	const stateBaseText = await Axios.get(sourceMap[stateBase!]);
	const fileUri = vscode.Uri.joinPath(result?.pop()!, fileName!);
	var uint8array = new TextEncoder().encode(stateBaseText.data);
	await vscode.workspace.fs.writeFile(fileUri, uint8array).then(
		() => vscode.commands.executeCommand(commandSource + '.refresh', new ClassSig(fileName.replace('.java',''), '', [stateBase!], fileUri))
	);
}

const getReactPanelContent = (panel: string, context: vscode.ExtensionContext) => {
	let title: string, subPath: string;
	if (panel == 'logviewer') {
		title = "Corda Log Viewer";
		subPath = "out/logviewer/frontend/";
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

const createLogViewPanel = (context) => {
	return vscode.window.createWebviewPanel( 
		'cordaLogViewer', 
		'Corda Log Viewer',
		vscode.ViewColumn.One, 
		{
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [ vscode.Uri.file(path.join(context.extensionPath, 'out/logviewer/frontend')) ]
		}
	)
};

const createNodeExplorerPanel = (context) => {
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

export const deactivate = () => {};