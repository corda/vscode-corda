import axios from "axios";
import * as vscode from 'vscode';
import axiosRetry from "axios-retry";
import { SERVER_BASE_URL } from '../CONSTANTS';
import { RunningNode, DeployedNode } from '../types';

// check server is up before login
const server_awake = async () => {
    const retryClient = axios.create({ baseURL: SERVER_BASE_URL })
    axiosRetry(retryClient, { retries: 5, retryDelay: (retryCount) => {
            return retryCount * 2000;
        }});
    return retryClient.get("/server_awake")
        .then(() => {
            console.log("Server is up");
        })
}

export const loginToNodes = async (context: vscode.ExtensionContext) => {
    await server_awake();

    let deployNodesConf: DeployedNode[] | undefined  = context.workspaceState.get("deployNodesConfig");
    let node: DeployedNode | undefined = (deployNodesConf !== undefined) ? deployNodesConf[1] : undefined; // first node for test : make sure to FILTER NOTARY

    let runningNodes: RunningNode[] | undefined = context.globalState.get("runningNodes");
    if (runningNodes === undefined) { runningNodes = [] }
    await axios.post(SERVER_BASE_URL + "/login", node?.loginRequest).then(async (response) => {
        console.log(response);
        runningNodes?.push({
            id: node?.id!,
            deployedNode: node!
        })
        await context.globalState.update("runningNodes", runningNodes);
    })

    // Update treeview details as needed
    console.log("test");
}