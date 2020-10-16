import * as vscode from 'vscode';

// PARSING
// tslint:disable-next-line: class-name
export interface CordaNodeConfig {
	[index: number]: ParsedNode
}

// PARSING
// tslint:disable-next-line: class-name
export interface CordaNodesDefaultConfig{
	rpcUsers: any
}

// PARSING
// tslint:disable-next-line: class-name
export interface CordaNodesConfig {
	node: CordaNodeConfig,
	nodeDefaults: CordaNodesDefaultConfig
}

// PARSING
// tslint:disable-next-line: class-name
export interface CordaTaskConfig {
    file: string,
	task: CordaNodesConfig
}

// tslint:disable-next-line: class-name
export interface ParsedNode {
    name: string,
    notary: [],
    p2pPort: string,
    rpcSettings: any,
    rpcUsers: any,
    jarDir: string
}

// An instance of a valid NODE in this project
export interface DefinedCordaNode {
    loginRequest: LoginRequest,
    idx500: string,
    rpcPort: string,
    x500: {
        name: string,
        city: string,
        country: string
    },
    nodeDef: ParsedNode
}

// Login Request to connect via RPC
// TODO: add CorDapp Dir to LoginRequest
export interface LoginRequest {
    hostName: string,
    port: string,
    username: string,
    password: string,
    cordappDir: string
}



// Instance of a node that is currently running its Corda.jar
// return UUID RPCClientId from login result
export interface RunningNode {
    idx500: string,
    rpcconnid: string | undefined, // unique ID For routing to proper rpc-connection
    definedNode: DefinedCordaNode,
    terminal: vscode.Terminal
}

// Dictionary of running nodes key'd by WORKSPACE
export interface RunningNodesList {
    //associated workspace/project
    [workspaceName: string]: {runningNodes: RunningNode[]}
}

export interface PanelEntry {
    [viewId: string]: vscode.WebviewPanel | undefined
}

