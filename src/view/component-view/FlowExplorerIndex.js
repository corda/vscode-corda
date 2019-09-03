import React, { Component } from "react";
import "../component-style/FlowExplorerIndex.css";
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import FlowInfoDisplay from "./FlowInfoDisplay";
import VaultTransactionDisplay from "./VaultTransactionDisplay";
import SnackBarWrapper from "./SnackBarWrapper";
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
            transactionMap: null,
            client: null,
            messages : []
        }
     
        let _this = this;
        this.state.allNodes = JSON.parse(document.getElementById('nodeList').innerHTML);
       // console.log("all nodes = " + JSON.stringify(this.state.allNodes))
        this.state.allNodes.forEach(function(node) {
            if(node.rpcUsers){
                _this.state.connections[node.name] = {
                    host: node.rpcSettings.address,
                    username: node.rpcUsers.user,
                    password: node.rpcUsers.password,
                    cordappDir: node.cordappDir   
                }
            }
          //  console.log("added node")
        });
       this.handleChange = this.handleChange.bind(this);
       this.startFlow = this.startFlow.bind(this);
       this.messageHandler = this.messageHandler.bind(this);
       this.flushNode = this.flushNode.bind(this);
       this.removeSnack = this.removeSnack.bind(this);
       
       // wait for websocket server to go up - 4 second delay between tries
        (function wsCon() {
        var ws = new WebSocket("ws://localhost:8080/session");
            setTimeout(function() {
                if (ws.readyState != 0 && ws.readyState != 1) {
                    console.log("attempting connect");
                    console.log(ws.readyState)
                }
                if (ws.readyState != 1) {
                    wsCon();
                } else {
                    _this.setState({
                        client: ws
                    })
                    //_this.state.client = ws;
                    _this.state.client.onmessage = (event) => {
                        _this.messageHandler(event);
                    }
                }
            }, 4000)
        })();
  
    }


    messageHandler(event) {
        //console.log(event.data)
        var evt = JSON.parse(event.data);
        var content = JSON.parse(evt.content);
        var status = JSON.parse(evt.result);

    //    console.log("status: " + evt.result);
    //    console.log("command received: " + evt.cmd);
    //    console.log("returned content: " + evt.content);

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

          if(evt.cmd === "getTransactionMap" || evt.cmd === "vaultTrackResponse"){
             // console.log(Object.values(content))
              this.setState({
                  transactionMap: Object.values(content)
              })
          }


          if(status.result === 'Flow Finished'){
              this.state.messages.push({content: "A flow of type " + content.flow + " finished",
                                        type: "success"
                                        
            })
              //this.state.messages.push(<SnackBarWrapper message={"A flow of type " + content.flow + " finished "} type="success" remove={this.removeSnack}/>)
              this.setState(
                    this.state.messages
              )

          }

        if(status.status === 'ERR'){
            this.state.messages.push({content: "An error occured: " + status.result,
                                        type: "error"
            })
            this.setState(
                this.state.messages
            )
        }

    }

    removeSnack(item){
        //console.log("remove: " +  JSON.stringify(item))
        //console.log(item)
        this.state.messages = this.state.messages.reverse();
        var index = this.state.messages.indexOf(item)
        //console.log(index)
        if(index > -1) {
            this.state.messages.splice(index, 1);
        }
        this.state.messages = this.state.messages.reverse();
        //console.log(JSON.stringify(this.state.messages))
        this.setState(this.state.messages);
    }

    chosenNode(connection) {
        // propagate initial node info
       // this.client.onopen = () => {
            this.state.client.send(JSON.stringify({"cmd":"connect","content":JSON.stringify(
                connection
            )}));
            
        //}    
    }

    loadNodeInfo(){
        this.state.client.send(JSON.stringify({"cmd":"getNodeInfo"}));
    }

    loadFlowInfo(){
        this.state.client.send(JSON.stringify({"cmd": "getRegisteredFlows"}))
        this.state.client.send(JSON.stringify({"cmd": "getRegisteredFlowParams"}))
    }

    loadTransactionHistory(){
        this.state.client.send(JSON.stringify({"cmd": "getTransactionMap"}))
    }

    startFlow(flowName, paramValues){
        var content = {
          "flow" : flowName,
          "args" : paramValues
        }
        this.state.client.send(JSON.stringify({"cmd": "startFlow", "content":JSON.stringify(           
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
        if (this.state.client == null) {
            return (
                <div>
                    Waiting for Node Server.
                    <div class="fa-3x">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                </div>
            )
        }

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
           DisplayFlowList = <FlowInfoDisplay selectedNode = {this.state.selectedNode} flowNames = {this.state.flowNames} flowParams = {this.state.flowParams} startFlow = {this.startFlow} />
       }

       if(this.state.transactionMap){
           DisplayVaultTransactions = <VaultTransactionDisplay transactionMap = {this.state.transactionMap} />
       }
       return (
            <div>
                <Grid container spacing={4}>
                    <Grid item sm={6}>
                        <FormControl >
                        
                            <InputLabel htmlFor="node-selector" >Choose Node</InputLabel>
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
                                        return (<MenuItem key={"node" + index} value={node.name}>{node.name.match(re)[0]}</MenuItem>)
                                    }
                                })}
                            </Select>
                        </FormControl>
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
                {this.state.messages.map((message, index) => { 
                   
                    return ( <SnackBarWrapper key={"error" + index} message={message} remove={this.removeSnack}/>);
                })}
               
            </div>
                
            
    )
  }
}