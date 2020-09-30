import { propTypes } from "react-bootstrap/esm/Image";
import { consoleTestResultHandler } from "tslint/lib/test";
import { TxRequests } from "../../types/CONSTANTS";
import { FlowData, FlowInfo, Page } from "../types";

declare var acquireVsCodeApi;

const vscode = acquireVsCodeApi(); // access to API 

const defaultPage: Page = {
    "pageSize": 10,
    "offset": 0
};

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