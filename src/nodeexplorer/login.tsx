import axios from "axios";
import * as vscode from 'vscode';
import axiosRetry from "axios-retry";
import context from "react-bootstrap/esm/AccordionContext";
import { SERVER_BASE_URL } from '../CONSTANTS';
import { cordaNodeConfig, cordaNodeDefaultConfig, cordaNodesConfig, cordaNode } from '../projectUtils';

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

    let deployNodesConfig: cordaNodesConfig | undefined = context.workspaceState.get("deployNodesConfig");
    let node: cordaNode | undefined = deployNodesConfig?.node[1]; // first node for test : make sure to FILTER NOTARY

    let hostName:string = node?.rpcSettings.address;
    let hostNameSplit:string[] = hostName.split(":");
    let cred:{user:string, pass:string} = {user:"", pass:""};
    
    if (node?.rpcUsers) {
        cred.user = node.rpcUsers.user;
        cred.pass = node.rpcUsers.password;
    } else {
        cred.user = deployNodesConfig?.nodeDefaults.rpcUsers.user;
        cred.pass = deployNodesConfig?.nodeDefaults.rpcUsers.password;
    }
    
    let loginRequest: loginRequest = {
        hostName: hostNameSplit[0],
        port: hostNameSplit[1],
        username: cred.user,
        password: cred.pass
    }

    let runningNodes: runningNode[] | undefined = context.globalState.get("runningNodes");
    if (runningNodes === undefined) { runningNodes = [] }
    await axios.post(SERVER_BASE_URL + "/login", loginRequest).then(async (response) => {
        console.log(response);
        runningNodes?.push({
            login: loginRequest,
            id: response.data.data.name,
            x500: response.data.data,
            nodeConf: node,
        })
        await context.globalState.update("runningNodes", runningNodes);
    })

    // Update treeview details as needed
    console.log("test");
}

interface loginRequest {
    hostName: string,
    port: string,
    username: string,
    password: string,
}

interface runningNode {
    login: loginRequest,
    id: string,
    x500: {
        name: string,
        city: string,
        country: string
    },
    nodeConf: cordaNode | undefined
}