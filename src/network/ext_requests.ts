import axios from "axios";
import * as vscode from 'vscode';
import { FlowInfo, NetworkMap, Page } from "./types";
import { SERVER_BASE_URL, GlobalStateKeys, WorkStateKeys } from '../types/CONSTANTS';
import { RunningNode, RunningNodesList } from "../types/types";

/**
 * REQUESTS are executed on extension side for flexibility and future actions on data
 * FLOW: webview (post-ext) -> networkCommand (requets) -> networkCommand (post-view)
 */

// network map requests

export const getNetworkMap = async (context: vscode.ExtensionContext): Promise<NetworkMap | undefined> => {
    
    // obtain needed request tokens - TODO: decouple the network map from any individual instance of RPC connection.
    const clientToken = context.globalState.get(GlobalStateKeys.CLIENT_TOKEN);

    const globalRunningNodesList: RunningNodesList | undefined = context.globalState.get(GlobalStateKeys.RUNNING_NODES);
	const workspaceName = vscode.workspace.name;
    
    const runningNodes: RunningNode[] = globalRunningNodesList![workspaceName!].runningNodes;
    const firstNodeRPCconnid = runningNodes![0].rpcconnid;

    axios.defaults.headers.common['clienttoken'] = clientToken;
    axios.defaults.headers.common['rpcconnid'] = firstNodeRPCconnid;
    try {
        const response = await axios.get(SERVER_BASE_URL + '/network-map');
        return response.data.data;
    } catch (error) {
        console.log(error.response);
        // return error.response;
        return;
    }
}

// transaction requests

// export const txFetchTxList = async (page: Page) => {
//     try {
//         const response = await axios.post(SERVER_BASE_URL + "/transaction-list", page);
//         return response.data.data;
//     } catch (error) {
//         console.log(error.response);
//         // return error.response;
//     }
// }

// export const txStartFlow = async (flowInfo: FlowInfo) => {
//     try {
//         const response = await axios.post(SERVER_BASE_URL + "/start-flow", flowInfo);
//         return response.data.data;
//     } catch (error) {
//         console.log(error.response);
//         // return error.response;
//     }
// }

// export const txFetchFlowList = async () => {
//     try {
//         const response = await axios.get(SERVER_BASE_URL + "/flow-list");
//         return response.data.data;
//     } catch (error) {
//         console.log(error.response);
//         // return error.response;
//     }
// }

// export const txFetchParties = async () => {
//     try {
//         const response = await axios.get(SERVER_BASE_URL + "/party-list");
//         return response.data.data;
//     } catch (error) {
//         console.log(error.response);
//         // return error.response;
//     }
// }

// export const txLoadFlowParams = async () => {
//     // try {
//     //     const response = await axios.post(SERVER_BASE_URL + "/transaction-list", page);
//     //     return response.data.data;
//     // } catch (error) {
//     //     console.log(error.response);
//     //     // return error.response;
//     // }
// }

// export const txCloseTxModal = async () => {
//     // try {
//     //     const response = await axios.post(SERVER_BASE_URL + "/transaction-list", page);
//     //     return response.data.data;
//     // } catch (error) {
//     //     console.log(error.response);
//     //     // return error.response;
//     // }
// }

// export const txOpenTxModal = async () => {
//     // try {
//     //     const response = await axios.post(SERVER_BASE_URL + "/transaction-list", page);
//     //     return response.data.data;
//     // } catch (error) {
//     //     console.log(error.response);
//     //     // return error.response;
//     // }
// }

// export const txSetFlowSelectionFlag = async () => {
//     // try {
//     //     const response = await axios.post(SERVER_BASE_URL + "/transaction-list", page);
//     //     return response.data.data;
//     // } catch (error) {
//     //     console.log(error.response);
//     //     // return error.response;
//     // }
// }

// export const txInFlightFlow = async () => {
//     // try {
//     //     const response = await axios.post(SERVER_BASE_URL + "/transaction-list", page);
//     //     return response.data.data;
//     // } catch (error) {
//     //     console.log(error.response);
//     //     // return error.response;
//     // }
// }