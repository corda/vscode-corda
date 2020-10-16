import * as vscode from 'vscode';
import { panelStart } from '../utils/panelsUtils';
import { runGradleTaskCallback, openFileCallback } from './generalCommands';
import { WorkStateKeys, GlobalStateKeys, RUN_CORDA_CMD, Commands, Contexts, TxRequests, DebugConst, SERVER_BASE_URL, SERVER_JAR } from '../types/CONSTANTS';
import { areNodesDeployed, isNetworkRunning } from '../utils/networkUtils';
import { RunningNode, RunningNodesList, DefinedCordaNode } from '../types/types';
import { MessageType, WindowMessage } from "../logviewer/types";
// import * as request from "../logviewer/request";
import * as requests from '../network/ext_requests'
import { AxResponse, FlowInfo, NetworkMap, Page } from '../network/types';
import { terminalIsOpenForNode } from '../utils/terminalUtils';
import { DefinedCordaNodeTreeItem } from '../treeDataProviders/cordaLocalNetwork';
import axios from "axios";
import axiosRetry from "axios-retry";
import { findTerminal } from '../utils/terminalUtils';
import { sleep } from '../utils/projectUtils';

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

/**
 * Launches the network map webview
 * @param context 
 */
export const networkMapCallback = async (context: vscode.ExtensionContext) => {
    await panelStart('networkmap', undefined, context);
    
    const networkData:NetworkMap | undefined = await requests.getNetworkMap(context);

    let panel: vscode.WebviewPanel | undefined = context.workspaceState.get('networkmap');
    
    if (context.globalState.get(GlobalStateKeys.IS_ENV_CORDA_NET)) { await sleep(2000) } // small sleep for online IDE
    await panel?.webview.postMessage(networkData);
}

/**
 * Launches the transactions webview
 * @param node
 * @param context 
 */
export const transactionsCallback = async (node: DefinedCordaNodeTreeItem, context: vscode.ExtensionContext) => {
    await panelStart('transactions', node.nodeDetails, context);

    let panel: vscode.WebviewPanel | undefined = context.workspaceState.get('transactions');

    // TODO: Below event handler will be used on migration to Extension side REST 
    // panel?.webview.onDidReceiveMessage(
    //     async (message) => {
    //         let response:any;
    //         let data = message.data;
    //         let text = message.text;
    //         switch (message.request) {
    //             case 'TestingRequest':
    //                 vscode.window.showInformationMessage(text);
    //                 response = "full loop";
    //                 break;
    //             case TxRequests.FETCHTXLIST:
    //                 response = await requests.txFetchTxList(data as Page);
    //                 break;
    //             case TxRequests.STARTFLOW:
    //                 response = await requests.txStartFlow(data as FlowInfo)
    //                 break;
    //             case TxRequests.FETCHFLOWLIST:
    //                 response = await requests.txFetchFlowList();
    //                 break;
    //             case TxRequests.FETCHPARTIES:
    //                 response = await requests.txFetchParties();
    //                 break;
    //         }
    //         if (response) {
    //             let reply: AxResponse = {request: message.request, response: response}
    //             panel?.webview.postMessage(reply);
    //         }
    //     },
    //     undefined,
    //     context.subscriptions
    // );
}

/**
 * Launches the vaultquery webview
 * @param node
 * @param context 
 */
export const vaultqueryCallback = async (node: DefinedCordaNodeTreeItem, context: vscode.ExtensionContext) => {
    await panelStart('vaultquery', node, context);
}

/**
 * Launches the logViewer webview
 * @param node 
 * @param context 
 */
export const logviewerCallback = async (node: DefinedCordaNodeTreeItem, context: vscode.ExtensionContext) => {
    const path = require('path');    
    await panelStart('logviewer', node, context);
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
export const runNetworkCallback = async (context: vscode.ExtensionContext, progress: vscode.Progress<any>) => {
    
    progress.report({ increment: 10, message: "Preparing network" });
    await sleep(1000);
    
    // dispose any previous instances
    await disposeRunningNodes(context);

    // fetch client token and check that server_awake
    const clientToken = `${context.globalState.get(GlobalStateKeys.CLIENT_TOKEN)}`;
    await server_awake(clientToken, context);

    let runningNodes: RunningNode[] = []; // running nodes for this workspace
    let currentNode: RunningNode | undefined = undefined;
    
    progress.report({ increment: 30, message: "Starting nodes" });
    await sleep(1000);

    // launch terminal instances with corda.jar
    const deployedNodes:DefinedCordaNode[] | undefined = context.workspaceState.get(WorkStateKeys.DEPLOY_NODES_LIST);
    const javaExec18 = context.globalState.get(GlobalStateKeys.JAVA_EXEC);
    deployedNodes!.forEach((node: DefinedCordaNode) => {
        // Create terminal instance
        const nodeTerminal = vscode.window.createTerminal({
            name: node.x500.name + " : " + node.rpcPort,
            cwd: node.nodeDef.jarDir
        })
        nodeTerminal.sendText(javaExec18 + RUN_CORDA_CMD); // run Corda.jar

        // Define RunningNode
        currentNode = {
            idx500: node.idx500,
            rpcconnid: undefined,
            definedNode: node,
            terminal: nodeTerminal
        }

        // Add to runningNodes
        runningNodes.push(currentNode);
    })

    progress.report({ increment: 10, message: "Logging into nodes" });
    
    await loginToAllNodes(clientToken, runningNodes, context, progress); // LOGIN to each node
    
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
    await context.workspaceState.update(WorkStateKeys.IS_NETWORK_RUNNING, false);
    await vscode.commands.executeCommand('setContext', Contexts.IS_NETWORK_RUNNING_CONTEXT, false);
    return true;
}

/**
 * checks if springBoot server is active - launches the client terminal if not existing
 * 
 * TODO: set-timeout and try a Kill/Reload of client
 */
export const server_awake = async (clientToken: string | undefined, context: vscode.ExtensionContext) => {
    
    launchClient(clientToken!, context); // is up, or launch

    axios.defaults.headers.common['clienttoken'] = clientToken;
    const retryClient = axios.create({ baseURL: SERVER_BASE_URL })
    axiosRetry(retryClient, { retries: 15, retryDelay: (retryCount) => {
            return retryCount * 2000;
        }});
    return await retryClient.get("/server_awake")
        .then(() => {
            console.log("Server is up");
        })
}

/**
 * preforms a login to all the running NODES
 * @param context 
 */
export const loginToAllNodes = async (clientToken: string, runningNodes: RunningNode[], context: vscode.ExtensionContext, progress: vscode.Progress<any>) => {
    
    axios.defaults.headers.common['clienttoken'] = clientToken;
    const progressFactor = 40 / runningNodes.length;
    let idx = 0;
    for (const node of runningNodes) {
        const loginResponse = await loginToNode(node.definedNode);
        progress.report({ increment: progressFactor, message: "Connecting to " + node.definedNode.x500.name });
        await sleep(500);
        runningNodes[idx].rpcconnid = loginResponse!.data.data.rpcConnectionId;
        idx++;
    }

    let globalRunningNodesList: RunningNodesList | undefined = context.globalState.get(GlobalStateKeys.RUNNING_NODES);
    globalRunningNodesList = (globalRunningNodesList === undefined) ? {} : globalRunningNodesList;
    const workspaceName:string = vscode.workspace.name!;
    globalRunningNodesList[workspaceName] = {runningNodes: runningNodes};
    await context.globalState.update(GlobalStateKeys.RUNNING_NODES, globalRunningNodesList); // Update global runnodes list
}


/**
 * Logs in to a single node with retry
 * @param node 
 */
export const loginToNode = async (node: DefinedCordaNode) => {
    for (let i = 0; i < 30; i++) {
        const response = await axios.post(SERVER_BASE_URL + "/login", node.loginRequest);
        if (response.data.status) {
            return response;
        }
        await sleep(2000); // SLEEP for node up
    }
    vscode.window.showErrorMessage("Unable to connect to nodes");
}

/**
 * LaunchClient will check if the client terminal is already active - if not it will spawn and run an instance
 * 
 * TODO: switch check to server_awake
 */
export function launchClient(clientToken: string, context: vscode.ExtensionContext) {
    let debug = true;

	// Launch client
    const name = 'Node Client Server'
    const javaExec18 = context.globalState.get(GlobalStateKeys.JAVA_EXEC);
	let terminal : vscode.Terminal | undefined = findTerminal(name);
	if (!terminal) { // check if client already launched
		const jarPath = vscode.extensions.getExtension("R3.vscode-corda")?.extensionPath;
		const cmd1 = 'cd ' + jarPath;
		const cmd2 = javaExec18 + ' -jar ' + SERVER_JAR + ' --servertoken=' + clientToken;
		terminal = vscode.window.createTerminal(name);
		terminal.sendText(cmd1);
        terminal.sendText(cmd2);
		debug ? console.log("Client Launch Successful"):"";
	} else {
		debug ? console.log("Client Already Up"):"";
	}
}