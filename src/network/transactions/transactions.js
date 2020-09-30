import React, { Component } from 'react';
import * as ReactDOM from 'react-dom';
import { TxRequests } from '../../types/CONSTANTS';
import { vTxFetchFlowList, vTxFetchTxList } from './view_requests';
import { TransactionExplorer } from './transactionExplorer';
import { Button } from '@material-ui/core';

// let responses = [];

// window.addEventListener("message", event => {
//     console.log(event.data);
//     responses.push(
//         event.data   
//     );

//     ReactDOM.render(
//         <>
//         Transactions View
//         {JSON.stringify(responses)}
//         </>, 
//         document.getElementById('root')
//     );
// });

// testRESTApi();


let txProps = {
    registeredFlows: [],
    flowParams: [],
    transactionList:[],
    totalRecords: "",
    parties: [],
    open: false,
    flowSelected: false,
    flowInFlight: false,
    flowResultMsg: "",
    flowResultMsgType: true
}

let defaultPage = {
    "pageSize": 10,
    "offset": 0
};

const StartExplorer = () => {
    const [props, setProps] = React.useState(txProps);

    const handleResponse = (event) => {
        console.log(event.data);
        let request = event.data.request;
        let response = event.data.response;
        switch (request) {
            case TxRequests.FETCHTXLIST:
                setProps({
                    ...props,
                    transactionList: response.transactionData,
                    totalRecords: response.totalRecords
                });
                break;
            case TxRequests.STARTFLOW:
                setProps({
                    ...props,
                    flowInFlight: false,
                    flowResultMsg: response,
                    flowResultMsgType: true
                });
                vTxFetchTxList(defaultPage); // retrieve new txs for display
                break;
            case TxRequests.FETCHFLOWLIST:
                setProps({
                    ...props,
                    registeredFlows: response.flowInfoList
                });
                break;
            case TxRequests.FETCHPARTIES:
                setProps({
                    ...props,
                    parties: response
                });
                break;
            default:
                console.log("Unknown request :" + event.data);
        }
        console.log("handled props are: " + JSON.stringify(props));
    }
    React.useEffect(() => {
        console.log("in effect");
        window.addEventListener("message", event => handleResponse(event));
    })

    return <TransactionExplorer {...props} />
}

class Stopper extends Component {
    state = {
        click: false
    }
    constructor(props) {
        super(props);
    }

    clickHandler = () => {
        this.setState({
            click: !this.state.click
        })
    }

    render() {
        return (
            <div>
                {this.state.click ? 
                    <StartExplorer /> :
                    <Button onClick={this.clickHandler}>Launch Page</Button>
                }
            </div>
        )
    }
}


ReactDOM.render(
    <Stopper />, 
    document.getElementById('root')
);

// window.addEventListener("message", event => {
//     console.log(event.data);
//     let request = event.data.request;
//     let response = event.data.response;
//     switch (event.data.request) {
//         case TxRequests.FETCHTXLIST:
//             props = {
//                 ...props,
//                 transactionList: response.transactionData,
//                 totalRecords: response.totalRecords
//             }
//             break;
//         case TxRequests.STARTFLOW:
//             props = {
//                 ...props,
//                 flowInFlight: false,
//                 flowResultMsg: response,
//                 flowResultMsgType: true
//             }
//             vTxFetchTxList(defaultPage); // retrieve new txs for display
//             break;
//         case TxRequests.FETCHFLOWLIST:
//             props = {
//                 ...props,
//                 registeredFlows: response.flowInfoList
//             }
//             break;
//         case TxRequests.FETCHPARTIES:
//             props = {
//                 ...props,
//                 parties: response
//             }
//             break;
//         default:
//             console.log("Unknown request :" + event.data);
//     }

//     ReactDOM.render(
//         <TransactionExplorer {...props} />, 
//         document.getElementById('root')
//     );

// })

// Implement spinner prior to calls.


// TESTING ABOVE ============================

