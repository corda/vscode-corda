// tslint:disable-next-line: class-name
export interface cordaNode {
    name: string,
    notary: [],
    p2pPort: string,
    rpcSettings: any,
    rpcUsers: any,
    cordappDir: string;
}

// tslint:disable-next-line: class-name
export interface cordaNodeConfig {
	[index: number]: { name: string; notary: []; p2pPort: string, rpcSettings : any, rpcUsers : any, cordappDir: string};
}

// tslint:disable-next-line: class-name
export interface cordaNodeDefaultConfig{
	rpcUsers: any;
}

// tslint:disable-next-line: class-name
export interface cordaNodesConfig {
	node: cordaNodeConfig;
	nodeDefaults: cordaNodeDefaultConfig;
}


// tslint:disable-next-line: class-name
export interface cordaTaskConfig {
	task: cordaNodesConfig;
}

export interface loginRequest {
    hostName: string,
    port: string,
    username: string,
    password: string,
}

export interface runningNode {
    login: loginRequest,
    id: string,
    x500: {
        name: string,
        city: string,
        country: string
    },
    nodeConf: cordaNode | undefined
}