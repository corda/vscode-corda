import * as vscode from 'vscode';
import { panelStart } from '../utils/panelsUtils';
import { runGradleTaskCallback, openFileCallback } from './generalCommands';
import { WorkStateKeys, GlobalStateKeys, RUN_CORDA_CMD, Commands, Contexts, TxRequests } from '../types/CONSTANTS';
import { areNodesDeployed, isNetworkRunning } from '../utils/networkUtils';
import { RunningNode, RunningNodesList, DefinedNode } from '../types/types';
import { MessageType, WindowMessage } from "../logviewer/types";
import * as request from "../logviewer/request";
import * as requests from '../network/ext_requests'
import { NetworkMap, Page } from '../network/types';
import { terminalIsOpenForNode } from '../utils/terminalUtils';

/**
 * Deploys nodes in project with pre-req checking
 * @param context 
 */
export const deployNodesCallback = async (context: vscode.ExtensionContext) => {
    const userConf = async () => { // confirm with user and decide whether to deploy nodes.
        let shouldDeploy = true;
        if (await areNodesDeployed(context)) {
            await vscode.window.showInformationMessage("Network is already deployed. Re-deploy will reset node data.", 'Run Network', 'Re-deploy', 'Cancel')
                .then((selection) => {
                    switch (selection) {
                        case 'Run Network':
                            // RUN TASK
                            vscode.commands.executeCommand(Commands.NETWORK_RUN);
                            shouldDeploy = false; // quit the command
                            break;
                        case 'Re-deploy':
                            shouldDeploy = true;
                            break;
                        default:
                            shouldDeploy = false; // quit the command
                    }
                })
        }
        return shouldDeploy;
    }
    await userConf().then((deployNodes) => {
        if (!deployNodes) return;
        runGradleTaskCallback("deployNodes").then(async () => {
            await areNodesDeployed(context); // double check in case of interruption of task
        });
    })
}

export const logviewerCallback = async (context: vscode.ExtensionContext) => {
    const path = require('path');
    
    await panelStart('logviewer', context);

    const filepath = path.join(context.extensionPath, "smalllog.log");
    request.countEntries(filepath).then(count => {
        let panel: vscode.WebviewPanel | undefined = context.workspaceState.get('logviewer');
        panel?.webview.postMessage({
            messageType: MessageType.NEW_LOG_ENTRIES,
            filepath,
            entriesCount: count
        } as WindowMessage)
    })
}

/**
 * Launches the network map webview
 * @param context 
 */
export const networkMapCallback = async (context: vscode.ExtensionContext) => {
    await panelStart('networkmap', context);
    
    const networkData:NetworkMap | undefined = await requests.getNetworkMap();

    let panel: vscode.WebviewPanel | undefined = context.workspaceState.get('networkmap');
    panel?.webview.postMessage(networkData);
}

/**
 * Launches the transactions webview
 * @param context 
 */
export const transactionsCallback = async (context: vscode.ExtensionContext) => {
    await panelStart('transactions', context);

    let panel: vscode.WebviewPanel | undefined = context.workspaceState.get('transactions');
    panel?.webview.onDidReceiveMessage(
        async (message) => {
            let response:any;
            let data = message.data;
            let text = message.text;
            switch (message.request) {
                case 'TestingRequest':
                    vscode.window.showInformationMessage(text);
                    response = "full loop";
                    break;
                case TxRequests.FETCHTXLIST:
                    response = await requests.txFetchTxList(data as Page);
                    break;
                case TxRequests.STARTFLOW:
                    break;
                case TxRequests.FETCHFLOWLIST:
                    break;
                case TxRequests.FETCHPARTIES:
                    break;
                case TxRequests.LOADFLOWPARAMS:
                    break;
                case 'txCloseTxModal':
                    break;
                case 'txOpenTxModal':
                    break;
                case 'txSetFlowSelectionFlag':
                    break;
                case 'txInFlightFlow':
                    break;
            }
            if (response) {
                panel?.webview.postMessage(response);
            }
        },
        undefined,
        context.subscriptions
    );
}

/**
 * Launches the vaultquery webview
 * @param context 
 */
export const vaultqueryCallback = async (context: vscode.ExtensionContext) => {
    await panelStart('vaultquery', context);
}

/**
 * Opens up the relevant build.gradle for editing local network
 * @param context 
 */
export const editDeployNodesCallback = (context: vscode.ExtensionContext) => {
    const buildGradleFile: string | undefined = context.workspaceState.get(WorkStateKeys.DEPLOY_NODES_BUILD_GRADLE);
	openFileCallback(vscode.Uri.parse(buildGradleFile!));
	vscode.window.showInformationMessage("Configure your network in the deployNodes task.");
	// TODO: set the cursor on the deployNodes Task
}

/**
 * Runs the local test network as defined in the build.gradle
 * @param context 
 */
export const runNetworkCallback = async (context: vscode.ExtensionContext) => {
    await disposeRunningNodes(context);
    let globalRunningNodesList: RunningNodesList | undefined = context.globalState.get(GlobalStateKeys.RUNNING_NODES);
    globalRunningNodesList = (globalRunningNodesList === undefined) ? {} : globalRunningNodesList;

    const workspaceName:string = vscode.workspace.name!;

    let runningNodes: RunningNode[] = []; // running nodes for this workspace
    const deployedNodes:DefinedNode[] | undefined = context.workspaceState.get(WorkStateKeys.DEPLOY_NODES_LIST);
    deployedNodes!.forEach((node: DefinedNode) => {
        // Create terminal instance
        const nodeTerminal = vscode.window.createTerminal({
            name: node.x500.name + " : " + node.rpcPort,
            cwd: node.nodeConf.jarDir
        })
        nodeTerminal.sendText(RUN_CORDA_CMD); // run Corda.jar

        // Define RunningNode
        const thisRunningNode: RunningNode = {
            id: node.id,
            rpcClientId: undefined,
            deployedNode: node,
            terminal: nodeTerminal
        }

        // Add to runningNodes
        runningNodes.push(thisRunningNode);
    })

    // LOGIN to each node
    
    
    globalRunningNodesList![workspaceName] = {runningNodes};
    await context.globalState.update(GlobalStateKeys.RUNNING_NODES, globalRunningNodesList); // Update global runnodes list
    await isNetworkRunning(context); // update context
}

/**
 * Destroys instances of all running nodes of this project
 * @param context 
 */
export const disposeRunningNodes = async (context: vscode.ExtensionContext) => {
    const globalRunningNodesList: RunningNodesList | undefined = context.globalState.get(GlobalStateKeys.RUNNING_NODES);
	const workspaceName = vscode.workspace.name;
	if (globalRunningNodesList && globalRunningNodesList[workspaceName!] != undefined) {

        const runningNodes: RunningNode[] = globalRunningNodesList[workspaceName!].runningNodes;
    
        runningNodes.forEach((node: RunningNode) => {
            terminalIsOpenForNode(node, true); // find node and dispose            
        });

		delete globalRunningNodesList[workspaceName!]; // remove on deactivate
	}

    await context.globalState.update(GlobalStateKeys.RUNNING_NODES, globalRunningNodesList);
    // set workspace state and context
    await context.workspaceState.update(WorkStateKeys.IS_NETWORK_RUNNING, false);
    vscode.commands.executeCommand('setContext', Contexts.IS_NETWORK_RUNNING_CONTEXT, false);
    return true;
}