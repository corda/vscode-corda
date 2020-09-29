import * as vscode from 'vscode';
import { panelStart } from '../panels';
import { runGradleTaskCallback, openFile } from './general';
import { WorkStateKeys, GlobalStateKeys, RUN_CORDA_CMD, Commands } from '../CONSTANTS';
import { areNodesDeployed, isNetworkRunning, disposeRunningNodes } from '../networkUtils';
import { RunningNode, RunningNodesList, DefinedNode } from '../types';
import { MessageType, WindowMessage } from "../logviewer/types";
import * as request from "../logviewer/request";
import * as requests from '../network/requests'
import { NetworkMap_Data } from '../network/types';

/**
 * Deploys nodes in project with pre-req checking
 * @param context 
 */
export const deployNodesCallBack = async (context: vscode.ExtensionContext) => {
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

export const logviewer = async (context: vscode.ExtensionContext) => {
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
export const networkMap = async (context: vscode.ExtensionContext) => {
    panelStart('networkmap', context);
    const networkData:NetworkMap_Data = await requests.getNetworkMap();
    console.log(JSON.stringify(networkData));

    let panel: vscode.WebviewPanel | undefined = context.workspaceState.get('networkmap');
    panel?.webview.postMessage(networkData);
}

/**
 * Launches the transactions webview
 * @param context 
 */
export const transactions = async (context: vscode.ExtensionContext) => {
    panelStart('transactions', context);
}

/**
 * Launches the vaultquery webview
 * @param context 
 */
export const vaultquery = async (context: vscode.ExtensionContext) => {
    panelStart('vaultquery', context);
}

/**
 * Opens up the relevant build.gradle for editing local network
 * @param context 
 */
export const editDeployNodes = (context: vscode.ExtensionContext) => {
    const buildGradleFile: string | undefined = context.workspaceState.get(WorkStateKeys.DEPLOY_NODES_BUILD_GRADLE);
	openFile(vscode.Uri.parse(buildGradleFile!));
	vscode.window.showInformationMessage("Configure your network in the deployNodes task.");
	// TODO: set the cursor on the deployNodes Task
}

/**
 * Runs the local test network as defined in the build.gradle
 * @param context 
 */
export const runNetwork = async (context: vscode.ExtensionContext) => {
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