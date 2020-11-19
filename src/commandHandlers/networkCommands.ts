import * as vscode from 'vscode';
import * as path from 'path';
import { panelStart } from '../utils/panelsUtils';
import { runGradleTaskCallback, openFileCallback } from './generalCommands';
import { WorkStateKeys, GlobalStateKeys, RUN_CORDA_CMD, Commands, SERVER_BASE_URL, SERVER_JAR, Contexts } from '../types/CONSTANTS';
import { areNodesDeployed, isNetworkRunning } from '../utils/networkUtils';
import { RunningNode, RunningNodesList, DefinedCordaNode } from '../types/types';
import { DefinedCordaNodeTreeItem } from '../treeDataProviders/cordaLocalNetwork';
import axios from "axios";
import axiosRetry from "axios-retry";
import { findTerminal } from '../utils/terminalUtils';
import { sleep } from '../utils/projectUtils';
import { disposeRunningNodes } from '../utils/stateUtils';
import { debug } from '../extension';

/**
 * Deploys nodes in project with pre-req checking
 * @param context 
 */
export const deployNodesCallback = async (context: vscode.ExtensionContext, forceDeploy?: boolean) => {
    const userConf = async () => { // confirm with user and decide whether to deploy nodes.
        let shouldDeploy = true;
        if (await areNodesDeployed(context) && !forceDeploy) {
            var selectItems: vscode.MessageItem[] = [{title: 'Run Network'}, {title: 'Re-deploy'}, {title:'Cancel'}]
            if (await isNetworkRunning(context)) {
                selectItems.shift(); // remove the 'Run Network' option if it is already running
            }
            await vscode.window.showInformationMessage("Network is already deployed. Re-deploy will reset node data.", ...selectItems)
                .then((selection) => {
                    switch (selection?.title) {
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
    await userConf().then(async (deployNodes) => {
        if (!deployNodes) return;
        // set context before initiating the task
        await vscode.commands.executeCommand('setContext', Contexts.ARE_NODES_DEPLOYED_CONTEXT, false);
        runGradleTaskCallback("deployNodes", undefined, context).then(async () => {
            await context.workspaceState.update(WorkStateKeys.DEPLOYMENT_DIRTY, false);
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
}

/**
 * Launches the transactions webview
 * @param node
 * @param context 
 */
export const transactionsCallback = async (node: DefinedCordaNodeTreeItem, context: vscode.ExtensionContext) => {
    await panelStart('transactions', node.nodeDetails, context);
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
    await panelStart('logviewer', node, context);
}

/**
 * Opens up the relevant build.gradle for editing local network
 * @param context 
 */
export const editDeployNodesCallback = (context: vscode.ExtensionContext) => {
    const buildGradleFile: string | undefined = context.workspaceState.get(WorkStateKeys.DEPLOY_NODES_BUILD_GRADLE);
	openFileCallback(vscode.Uri.parse("file:" + buildGradleFile, true));
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
            terminal: nodeTerminal,
            corDapps: undefined
        }

        // Add to runningNodes
        runningNodes.push(currentNode);
    })

    progress.report({ increment: 10, message: "Logging into nodes" });
    
    await loginToAllNodes(clientToken, runningNodes, context, progress); // LOGIN to each node
    
    await isNetworkRunning(context); // update context
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
        const currRpcConnid = loginResponse!.data.data.rpcConnectionId;
        runningNodes[idx].rpcconnid = currRpcConnid;
        axios.defaults.headers.common['rpcconnid'] = currRpcConnid;
        const corDappsInstalled = await fetchCordapps(node.definedNode);
        runningNodes[idx].corDapps = corDappsInstalled;
        idx++;
    }

    let globalRunningNodesList: RunningNodesList | undefined = context.globalState.get(GlobalStateKeys.RUNNING_NODES);
    globalRunningNodesList = (globalRunningNodesList === undefined) ? {} : globalRunningNodesList;
    const workspaceName:string = vscode.workspace.name!;
    globalRunningNodesList[workspaceName] = {runningNodes: runningNodes};
    await context.globalState.update(GlobalStateKeys.RUNNING_NODES, globalRunningNodesList); // Update global runnodes list
}

const fetchCordapps = async (node: DefinedCordaNode) => {
    const response = await axios.get(SERVER_BASE_URL + "/dashboard/node-diagnostics");
    if (response.data.status) {
        return response.data.data.cordapps;
    } else {
        return undefined;
    }
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
 */
export function launchClient(clientToken: string, context: vscode.ExtensionContext) {
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