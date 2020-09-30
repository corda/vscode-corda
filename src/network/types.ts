// network map types

export interface NetworkMap_Node {
    publicKey: string,
    name: string,
    city: string,
    country: string,
    lat: string,
    lng: string,
    address: string
}

export interface NetworkMap_Props {
    self: NetworkMap_Node | undefined,
    notaries: NetworkMap_Node[] | undefined,
    peers: NetworkMap_Node[] | undefined
}

// transaction types
export interface Page {
    pageSize: number,
    offset: number
}

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