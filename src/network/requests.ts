import axios from "axios";
import { NetworkMap_Props, Page } from "./types";
import { SERVER_BASE_URL } from '../types/CONSTANTS';

// network map requests

export const getNetworkMap = async (): Promise<NetworkMap_Props | undefined> => {
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

export const txFetchTxList = async (page: Page) => {
    try {
        const response = await axios.post(SERVER_BASE_URL + "/transaction-list", page);
        return response.data.data;
    } catch (error) {
        console.log(error.response);
        // return error.response;
    }
}

export const txStartFlow = async () => {
    // try {
    //     const response = await axios.post(SERVER_BASE_URL + "/transaction-list", page);
    //     return response.data.data;
    // } catch (error) {
    //     console.log(error.response);
    //     // return error.response;
    // }
}

export const txFetchFlowList = async (page: Page) => {
    try {
        const response = await axios.post(SERVER_BASE_URL + "/transaction-list", page);
        return response.data.data;
    } catch (error) {
        console.log(error.response);
        // return error.response;
    }
}

export const txFetchParties = async () => {
    // try {
    //     const response = await axios.post(SERVER_BASE_URL + "/transaction-list", page);
    //     return response.data.data;
    // } catch (error) {
    //     console.log(error.response);
    //     // return error.response;
    // }
}

export const txLoadFlowParams = async () => {
    // try {
    //     const response = await axios.post(SERVER_BASE_URL + "/transaction-list", page);
    //     return response.data.data;
    // } catch (error) {
    //     console.log(error.response);
    //     // return error.response;
    // }
}

export const txCloseTxModal = async () => {
    // try {
    //     const response = await axios.post(SERVER_BASE_URL + "/transaction-list", page);
    //     return response.data.data;
    // } catch (error) {
    //     console.log(error.response);
    //     // return error.response;
    // }
}

export const txOpenTxModal = async () => {
    // try {
    //     const response = await axios.post(SERVER_BASE_URL + "/transaction-list", page);
    //     return response.data.data;
    // } catch (error) {
    //     console.log(error.response);
    //     // return error.response;
    // }
}

export const txSetFlowSelectionFlag = async () => {
    // try {
    //     const response = await axios.post(SERVER_BASE_URL + "/transaction-list", page);
    //     return response.data.data;
    // } catch (error) {
    //     console.log(error.response);
    //     // return error.response;
    // }
}

export const txInFlightFlow = async () => {
    // try {
    //     const response = await axios.post(SERVER_BASE_URL + "/transaction-list", page);
    //     return response.data.data;
    // } catch (error) {
    //     console.log(error.response);
    //     // return error.response;
    // }
}