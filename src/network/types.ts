/**
 * Backend Types
 * These types map to model in https://github.com/corda/node-server
 */

// network map types

export interface NodeData {
    publicKey: string,
    name: string,
    city: string,
    country: string,
    lat: string,
    lng: string,
    address: string
}

export interface NetworkMap {
    self: NodeData | undefined,
    notaries: NodeData[] | undefined,
    peers: NodeData[] | undefined
}

// transaction types
export interface Page {
    pageSize: number,
    offset: number
}

export interface FlowParam {
    paramName: string,
    paramType: any,
    paramValue: any,
    parameterizedType: any,
    hasParameterizedType: boolean,
    flowParams: FlowParam[]
}

export interface FlowInfo {
    flowName: string,
    flowParams: FlowParam[],
    flowParamsMap: {[index:string]:FlowParam[]}
}

/**
 * Frontend Types
 */

export interface SelectedFlow {
    name: any,
    constructors: any,
    activeConstructor: any
}

export interface Transaction_State {
    page: {
        pageSize: any,
        offset: any,
    },
    flowInfo: any,
    selectedFlow: SelectedFlow | any,
    trnxDetail: {[index:number]:boolean},
    paramList: any[]
}

export interface Transaction_Props {
    registeredFlows: any,
    flowParams: any,
    transactionList: any[],
    totalRecords: number,
    parties: any,
    open: any,
    flowSelected: any,
    flowInFlight: any,
    flowResultMsg: any,
    flowResultMsgType: any
}