import { consoleTestResultHandler } from "tslint/lib/test";
import { TxRequests } from "../../types/CONSTANTS";
import { FlowInfo, Page } from "../types";

declare var acquireVsCodeApi;

const vscode = acquireVsCodeApi(); // access to API 

const sendRequest = (request: string, data:any) => {
    vscode.postMessage({
        request: request,
        data: data
    })
}

const vTxFetchTxList = (page:Page) => {
    sendRequest(TxRequests.FETCHTXLIST, page);
}

const vTxStartFlow = (flowInfo: FlowInfo) => {
    sendRequest(TxRequests.STARTFLOW, flowInfo);
}

const vTxFetchFlowList = () => {

}

const vTxFetchParties = () => {

}

const vTxLoadFlowParams = () => {

}

const vTxCloseTxModal = () => {

}

const vTxOpenTxModal = () => {

}

const vTxSetFlowSelectionFlag = () => {

}

const vTxInFlightFlow = () => {

}

export { 
    vTxFetchTxList,
    vTxStartFlow,
    vTxFetchFlowList,
    vTxFetchParties,
    vTxLoadFlowParams,
    vTxCloseTxModal,
    vTxOpenTxModal,
    vTxSetFlowSelectionFlag,
    vTxInFlightFlow
 };