import React, { Component } from "react";
import "../component-style/FlowExplorerIndex.css";
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';



export default class FlowExplorerIndex extends React.Component {

    constructor(props) {
       super(props)
       this.state = {
            selectedNode : "PartyA",
            connections: {},
            nodeInfo : null
       }
     
       let _this = this;
       this.state.allNodes = JSON.parse(document.getElementById('nodeList').innerHTML);
       this.state.allNodes.forEach(function(node) {
             if(node.rpcUsers){
                _this.state.connections[node.name] = {
                    host: node.rpcSettings.address,
                    username: node.rpcUsers.user,
                    password: node.rpcUsers.password
                }
            }
        });
       this.handleChange = this.handleChange.bind(this);
       
       this.client = new WebSocket("ws://localhost:8080/session");
       
        this.messageHandler = this.messageHandler.bind(this);
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

    handleChange(e){
        this.setState({
            selectedNode: e.target.value
        })

        this.chosenNode(this.state.connections[e.target.value])
        this.loadNodeInfo()
   }
   
   
   render() {
       let re = /(?<=O=)[^,]*/g;
       let displayNodeInfo = null;
       if(this.state.nodeInfo){
           displayNodeInfo =
           <div>
               <div>Legal Identity : {this.state.nodeInfo.legalIdentities}</div>
               <div>Addresses : {this.state.nodeInfo.addresses} </div>
               <div>Serial : {this.state.nodeInfo.serial} </div>
               <div>Platform Version : {this.state.nodeInfo.platformVersion} </div>
           </div>
       }
       return (
           <div>
            <FormControl >
                
                <InputLabel htmlFor="node-selector">Choose Node</InputLabel>
                <Select
                    value={this.state.selectedNode}
                    input={<Input name="party" id="node-selector" value={this.state.selectedNode} />}
                    onChange={this.handleChange}
                    className='flow-explorer-select-node'
                >
                    <MenuItem value="">
                        <em>None</em>
                    </MenuItem>
                    {this.state.allNodes.map((node,index) => {
                    if(node.rpcUsers){
                        return (<MenuItem data="oh hai mark" value={node.name}>{node.name.match(re)[0]}</MenuItem>)
                    }
                    })}
                </Select>
            </FormControl>
            {displayNodeInfo}
            </div>
    )
  }
}