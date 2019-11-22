import React from "react";
import * as clientrequest from "../ClientRequestHelper"
import FlowInfoDisplay from "./FlowInfoDisplay";
import VaultTransactionDisplay from "../VaultTransactionDisplay";
import NodeInfo from "../NodeInfo";
import NodeSelector from "../NodeSelector";

import SnackBarWrapper from "../SnackBarWrapper";
import Grid from '@material-ui/core/Grid';

export default function FlowExplorerView(props) {

    let DisplayNodeInfo = null;
    let DisplayFlowList = null;
    let DisplayVaultTransactions = null;

    if(props.state.nodeInfo){
        DisplayNodeInfo = <NodeInfo nodeInfo = {props.state.nodeInfo} />
        
    }
    if(props.state.flowParams){
        DisplayFlowList = <FlowInfoDisplay options = {props.state.options} selectedNode = {props.state.selectedNode} flowNames = {props.state.flowNames} flowParams = {props.state.flowParams} 
                                 client = {props.state.client} startFlow = {clientrequest.startFlow} />
    }

    if(props.state.transactionMap){
        DisplayVaultTransactions = 
        <div>
            <h3>The Vault (UNCONSUMED States)</h3>
            <VaultTransactionDisplay transactionMap = {props.state.transactionMap} />
         </div>
    }
    return (
         <div>
             <h1>Transaction Explorer</h1>
             <Grid container spacing={4}>
                 <Grid item sm={6}>
                     <NodeSelector allNodes = {props.state.allNodes} handleChange = {props.handleChange} />
                 </Grid>
             </Grid>
             <Grid  container spacing={4}>
                 <Grid item sm={4}> {DisplayNodeInfo} </Grid>
             </Grid>
             <Grid  container justify="center" alignitems="center" spacing={4}>
                 <Grid item sm={6}>{DisplayFlowList}</Grid>
             </Grid>
             <Grid container justify = "center" alignitems="center" spacing={2}>
                 
                 <Grid item sm={12}> {DisplayVaultTransactions} </Grid>
             </Grid>
             {props.state.messages.map((message, index) => { 
                 return ( <SnackBarWrapper key={"error" + index} message={message} remove={props.removeSnack}/>);
             })}
            
         </div>
             
         
    )
}