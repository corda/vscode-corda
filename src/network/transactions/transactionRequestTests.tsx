import { Page } from '../types';
import * as Requests from './view_requests';

export const testRESTApi = () => {
    console.log('in testRESTApi');
    testVTxFetchTxList();
}

const testVTxFetchTxList = () => {
    const data:Page = {
        "pageSize": 10,
        "offset": 0
    };
    Requests.vTxFetchTxList(data);
}

const testVTxStartFlow = () => {
    
}
