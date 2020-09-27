import * as vscode from 'vscode';

// tslint:disable-next-line: class-name
export interface CordaNode {
    name: string,
    notary: [],
    p2pPort: string,
    rpcSettings: any,
    rpcUsers: any,
    jarDir: string;
}

// PARSING
// tslint:disable-next-line: class-name
export interface CordaNodeConfig {
	[index: number]: CordaNode
}

// PARSING
// tslint:disable-next-line: class-name
export interface CordaNodesDefaultConfig{
	rpcUsers: any;
}

// PARSING
// tslint:disable-next-line: class-name
export interface CordaNodesConfig {
	node: CordaNodeConfig;
	nodeDefaults: CordaNodesDefaultConfig;
}

// PARSING
// tslint:disable-next-line: class-name
export interface CordaTaskConfig {
    file: string,
	task: CordaNodesConfig;
}

// Login Request to connect via RPC
// TODO: add CorDapp Dir to LoginRequest
export interface LoginRequest {
    hostName: string,
    port: string,
    username: string,
    password: string,
}

// Instance of a node that is currently running its Corda.jar
// return UUID RPCClientId from login result
export interface RunningNode {
    id: string,
    rpcClientId: string | undefined, // unique ID For routing to proper rpc-connection
    deployedNode: DefinedNode,
    terminal: vscode.Terminal
}

// Dictionary of running nodes key'd by WORKSPACE
export interface RunningNodesList {
    //associated workspace/project
    [workspaceName: string]: {runningNodes: RunningNode[]}
}

// An instance of a valid NODE in this project
export interface DefinedNode {
    loginRequest: LoginRequest,
    id: string,
    rpcPort: string,
    x500: {
        name: string,
        city: string,
        country: string
    },
    nodeConf: CordaNode
}