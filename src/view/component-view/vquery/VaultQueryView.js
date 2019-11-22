import React from "react";
import * as clientrequest from "../ClientRequestHelper"
import VaultTransactionDisplay from "../VaultTransactionDisplay";
import NodeInfo from "../NodeInfo";
import NodeSelector from "../NodeSelector";

import Grid from '@material-ui/core/Grid';

import VQueryBuilder from "./VQueryBuilder";

export default function VaultQueryView(props) {

    let DisplayNodeInfo = null;
    let DisplayVaultTransactions = null;
    let VaultQueryBuilder = null;

    if(props.state.nodeInfo){
        DisplayNodeInfo = <NodeInfo nodeInfo = {props.state.nodeInfo} />
    }
    if(props.state.transactionMap){
        if(props.state.stateNames) {
            VaultQueryBuilder = 
            <div>
                <h3>Vault Query Builder</h3>
                <VQueryBuilder allNodes={props.state.allNodes} contractStates={props.state.stateNames} client = {props.state.client} startUserVaultQuery={clientrequest.startUserVaultQuery} transactionMap = {props.state.transactionMap}/>
            </div>
        }
        DisplayVaultTransactions = 
        <div>
             <h3>The Vault</h3>
             <VaultTransactionDisplay transactionMap = {props.state.transactionMap} />
        </div>
       
    }
    return (
         <div>
             <h1>Vault Query Explorer</h1>
             <Grid container spacing={4}>
                 <Grid item sm={6}>
                     <NodeSelector allNodes = {props.state.allNodes} handleChange = {props.handleChange} />
                 </Grid>
             </Grid>
             <Grid  container spacing={4}>
                 <Grid item sm={4}> {DisplayNodeInfo} </Grid>
             </Grid>
             <Grid container direction="row" justify="center" alignItems="flex-start" spacing={2} wrap="nowrap">
                 <Grid item sm="auto" zeroMinWidth> {VaultQueryBuilder} </Grid>
                 <Grid item sm zeroMinWidth> {DisplayVaultTransactions} </Grid>
             </Grid>
         </div>
               
    )
}