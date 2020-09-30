import { TxRequests } from "../../types/CONSTANTS";
import { FlowInfo, Page } from "../types";

declare var acquireVsCodeApi;

const vscode = acquireVsCodeApi(); // access to API 

const sendRequest = (request: string, data?:any) => {
    vscode.postMessage({
        request: request,
        data: data
    })
}

const vTxFetchTxList = (page:Page) => {
    sendRequest(TxRequests.FETCHTXLIST, page);
}

// CHAIN with vTxFetchTxList
const vTxStartFlow = (flowInfo: FlowInfo) => {
    sendRequest(TxRequests.STARTFLOW, flowInfo);
}

const vTxFetchFlowList = () => {
    sendRequest(TxRequests.FETCHFLOWLIST);
}

const vTxFetchParties = () => {
    sendRequest(TxRequests.FETCHPARTIES);
}

export { 
    vTxFetchTxList,
    vTxStartFlow,
    vTxFetchFlowList,
    vTxFetchParties
 };