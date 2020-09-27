import axios from "axios";
import * as vscode from 'vscode';
import axiosRetry from "axios-retry";
import { SERVER_BASE_URL, WorkStateKeys, GlobalStateKeys } from '../CONSTANTS';
import { RunningNode, DefinedNode } from '../types';
import { findTerminal } from '../terminals';
import { SERVER_JAR } from '../CONSTANTS';


/**
 * checks if springBoot server is active - launches the client terminal if not existing
 * 
 * TODO: set-timeout and try a Kill/Reload of client
 */
export const server_awake = async () => {
    // client check
    launchClient();
    
    const retryClient = axios.create({ baseURL: SERVER_BASE_URL })
    axiosRetry(retryClient, { retries: 15, retryDelay: (retryCount) => {
            return retryCount * 2000;
        }});
    return retryClient.get("/server_awake")
        .then(() => {
            console.log("Server is up");
        })
}

/**
 * preforms a login to all the running NODES
 * @param context 
 */
export const loginToNodes = async (context: vscode.ExtensionContext) => {
    await server_awake();

    let deployNodesList: DefinedNode[] | undefined  = context.workspaceState.get(WorkStateKeys.DEPLOY_NODES_LIST);
    let node: DefinedNode | undefined = (deployNodesList !== undefined) ? deployNodesList[1] : undefined; // first node for test : make sure to FILTER NOTARY

    let runningNodes: RunningNode[] | undefined = context.globalState.get(GlobalStateKeys.RUNNING_NODES);
    if (runningNodes === undefined) { runningNodes = [] }
    await axios.post(SERVER_BASE_URL + "/login", node?.loginRequest).then(async (response) => {
        console.log(response);
        // runningNodes?.push({
        //     id: node?.id!,
        //     deployedNode: node!
        // })
        await context.globalState.update(GlobalStateKeys.RUNNING_NODES, runningNodes);
    })
}

/**
 * LaunchClient will check if the client terminal is already active - if not it will spawn and run an instance
 */
export function launchClient() {
    let debug = true;

	// Launch client
	const name = 'Node Client Server'
	let terminal : vscode.Terminal = findTerminal(name);
	if (!terminal) { // check if client already launched
		const jarPath = vscode.extensions.getExtension("R3.vscode-corda")?.extensionPath;
		const cmd1 = 'cd ' + jarPath;
		const cmd2 = 'java -jar ' + SERVER_JAR; // --servertoken=' + clientToken;
		terminal = vscode.window.createTerminal(name);
		terminal.sendText(cmd1);
        terminal.sendText(cmd2);
		debug ? console.log("Client Launch Successful"):"";
	} else {
		debug ? console.log("Client Already Up"):"";
	}
}