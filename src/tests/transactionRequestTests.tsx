import { FlowInfo, Page } from '../network/types';
import * as Requests from '../network/transactions/view_requests';

export const testRESTApi = () => {
    testVTxFetchTxList();
    // testVTxStartFlow();
    testVTxFetchFlowList();
    testVTxFetchParties();
}

const testVTxFetchTxList = () => {
    const data:Page = {
        "pageSize": 10,
        "offset": 0
    };
    Requests.vTxFetchTxList(data);
}

const testVTxStartFlow = () => {
    const data:FlowInfo = {
        "flowName" : "com.template.flows.Initiator",
        "flowParams" : [ {
          "paramName" : "sendTo",
          "paramType" : "net.corda.core.identity.Party",
          "paramValue" : "PartyB",
          "parameterizedType" : null,
          "hasParameterizedType" : false,
          "flowParams" : null
        } ],
        "flowParamsMap" : null
    }
    Requests.vTxStartFlow(data);   
}

const testVTxFetchFlowList = () => {
    Requests.vTxFetchFlowList();
}

const testVTxFetchParties = () => {
    Requests.vTxFetchParties();
}
