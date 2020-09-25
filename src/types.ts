// tslint:disable-next-line: class-name
export interface CordaNode {
    name: string,
    notary: [],
    p2pPort: string,
    rpcSettings: any,
    rpcUsers: any,
    cordappDir: string;
}

// tslint:disable-next-line: class-name
export interface CordaNodeConfig {
	[index: number]: CordaNode
}

// tslint:disable-next-line: class-name
export interface CordaNodesDefaultConfig{
	rpcUsers: any;
}

// tslint:disable-next-line: class-name
export interface CordaNodesConfig {
	node: CordaNodeConfig;
	nodeDefaults: CordaNodesDefaultConfig;
}


// tslint:disable-next-line: class-name
export interface CordaTaskConfig {
	task: CordaNodesConfig;
}

export interface LoginRequest {
    hostName: string,
    port: string,
    username: string,
    password: string,
}

export interface RunningNode {
    id: string,
    deployedNode: DeployedNode
}

 export interface DeployedNode {
     loginRequest: LoginRequest,
     id: string,
     x500: {
         name: string,
         city: string,
         country: string
     },
     nodeConf: CordaNode
 }