import axios from "axios";
import { NetworkMap_Data } from "./types";
import { SERVER_BASE_URL } from '../CONSTANTS';

export const getNetworkMap = async (): Promise<NetworkMap_Data> => {
    const response = await axios.get(SERVER_BASE_URL + '/network-map');
    return response.data.data;
}