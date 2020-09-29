export interface NetworkMap_Node {
    publicKey: string,
    name: string,
    city: string,
    country: string,
    lat: string,
    lng: string,
    address: string
}

export interface NetworkMap_Data {
    self: NetworkMap_Node | undefined,
    notaries: NetworkMap_Node[] | undefined,
    peers: NetworkMap_Node[] | undefined
}