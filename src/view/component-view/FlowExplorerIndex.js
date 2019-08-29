import React, { Component } from "react";
import "../component-style/FlowExplorerIndex.css";
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import FlowInfoDisplay from "./FlowInfoDisplay";
import VaultTransactionDisplay from "./VaultTransactionDisplay";
import Grid from '@material-ui/core/Grid';




export default class FlowExplorerIndex extends React.Component {

    constructor(props) {
       super(props)
       this.state = {
            selectedNode : "PartyA",
            connections: {},
            nodeInfo : null,
            flowNames: [],
            flowParams:null,
            transactionMap: null
       }
     
       let _this = this;
       this.state.allNodes = JSON.parse(document.getElementById('nodeList').innerHTML);
       this.state.allNodes.forEach(function(node) {
             if(node.rpcUsers){
                _this.state.connections[node.name] = {
                    host: node.rpcSettings.address,
                    username: node.rpcUsers.user,
                    password: node.rpcUsers.password,
                    cordappDir: node.cordappDir   
                }
            }
        });
       this.handleChange = this.handleChange.bind(this);
       this.startFlow = this.startFlow.bind(this);
       this.client = new WebSocket("ws://localhost:8080/session");
       
        this.messageHandler = this.messageHandler.bind(this);
        this.flushNode = this.flushNode.bind(this);
        // set event handler for websocket
        this.client.onmessage = (event) => {
            this.messageHandler(event);
        }
    }

    messageHandler(event) {
    
        var evt = JSON.parse(event.data);
        var content = JSON.parse(evt.content);

        console.log("command received: " + evt.cmd);
        console.log("returned content: " + evt.content);

        if (evt.cmd == "getNodeInfo") {
            this.setState({
                nodeInfo : content
            })
        }

        if(evt.cmd == "getRegisteredFlows"){
            this.setState({
               flowNames : content
            })
          }
   
          if(evt.cmd === "getRegisteredFlowParams"){
            this.setState({
              flowParams : content
            })
          }

          if(evt.cmd === "getTransactionMap"){
             // console.log(Object.values(content))
              this.setState({
                  transactionMap: Object.values(content)
              })
          }

    }


    chosenNode(connection) {
        // propagate initial node info
       // this.client.onopen = () => {
            this.client.send(JSON.stringify({"cmd":"connect","content":JSON.stringify(
                connection
            )}));
            
        //}    
    }

    loadNodeInfo(){
        this.client.send(JSON.stringify({"cmd":"getNodeInfo"}));
    }

    loadFlowInfo(){
        this.client.send(JSON.stringify({"cmd": "getRegisteredFlows"}))
        this.client.send(JSON.stringify({"cmd": "getRegisteredFlowParams"}))
    }

    loadTransactionHistory(){
        this.client.send(JSON.stringify({"cmd": "getTransactionMap"}))
    }

    startFlow(flowName, paramValues){
        var content = {
          "flow" : flowName,
          "args" : paramValues
        }
        this.client.send(JSON.stringify({"cmd": "startFlow", "content":JSON.stringify(           
          content
         )}));
      }


    flushNode(){
        this.setState({
            nodeInfo : null,
            flowNames: [],
            flowParams:null,
            transactionMap: null
        })
       
    }
    

    handleChange(e){
        this.setState({
            selectedNode: e.target.value
        })
        if (e.target.value){
            this.chosenNode(this.state.connections[e.target.value])
            this.loadNodeInfo()
            this.loadFlowInfo()
            this.loadTransactionHistory()
        }else{
            this.flushNode()
        }
   }
   
   
   render() {
       let re = /(?<=O=)[^,]*/g;
       let DisplayNodeInfo = null;
       let DisplayFlowList = null;
       let DisplayVaultTransactions = null;
       if(this.state.nodeInfo){
           DisplayNodeInfo =
           <div>
               <div>Legal Identity : {this.state.nodeInfo.legalIdentities}</div>
               <div>Addresses : {this.state.nodeInfo.addresses} </div>
               <div>Serial : {this.state.nodeInfo.serial} </div>
               <div>Platform Version : {this.state.nodeInfo.platformVersion} </div>
           </div>
       }
       if(this.state.flowParams){
           DisplayFlowList = <FlowInfoDisplay flowNames = {this.state.flowNames} flowParams = {this.state.flowParams} startFlow = {this.startFlow} />
       }

       if(this.state.transactionMap){
           DisplayVaultTransactions = <VaultTransactionDisplay transactionMap = {this.state.transactionMap} />
       }
       return (
           <div>
                <Grid  spacing={4}>
                    <Grid item sm={6}>
                        <FormControl >
                        
                            <InputLabel htmlFor="node-selector">Choose Node</InputLabel>
                            <Select
                                value={this.state.selectedNode}
                                input={<Input name="party" id="node-selector" value={this.state.selectedNode} />}
                                onChange={this.handleChange}
                                className='flow-explorer-select-node'
                            >
                                <MenuItem value={null}>
                                    <em>None</em>
                                </MenuItem>
                                {this.state.allNodes.map((node,index) => {
                                if(node.rpcUsers){
                                    return (<MenuItem value={node.name}>{node.name.match(re)[0]}</MenuItem>)
                                }
                                })}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                <Grid  spacing={4}>
                    <Grid item sm={4}> {DisplayNodeInfo} </Grid>
                </Grid>
                <Grid  container justify="center" alignitems="center" spacing={4}>
                    <Grid item sm={6}>{DisplayFlowList}</Grid>
                </Grid>
                <Grid container justify = "center" alignitems="center" spacing={2}>
                    <Grid item sm={12}> {DisplayVaultTransactions} </Grid>
                </Grid>
            </div>
                
            
    )
  }
}