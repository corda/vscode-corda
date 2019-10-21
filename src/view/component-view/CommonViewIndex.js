import React from "react";
import "../component-style/FlowExplorerIndex.css";
import * as clientrequest from "./ClientRequestHelper";
import FlowExplorerView from "./flowexplorer/FlowExplorerView";
import VaultQueryView from "./vquery/VaultQueryView";

export default class CommonViewIndex extends React.Component {

    constructor(props) {
       super(props)
       this.state = {
            selectedNode : "PartyA",
            connections: {},
            nodeInfo : null,
            stateNames: null,
            flowNames: [],
            flowParams:null,
            transactionMap: null,
            client: null,
            messages : [],
            options : {
                'boolean' : [{"value" : "true","label":"true"}, {"value": "false", "label":"false"}]
            }
        }
     
        let re = /(?<=O=)[^,]*/g;

        let _this = this;
        var defaultSettings = JSON.parse(document.getElementById('nodeDefaults').innerHTML);
        console.log(JSON.stringify(defaultSettings))
        this.state.allNodes = JSON.parse(document.getElementById('nodeList').innerHTML);
        this.state.options.party = []
        this.state.allNodes.forEach(function(node) {
            if(!node.notary){
                _this.state.options.party.push({"value": node.name.match(re)[0], "label" : node.name.match(re)[0]})
                _this.state.connections[node.name] = {
                    host: node.rpcSettings.address,
                    cordappDir: node.cordappDir   
                }
                if(node.rpcUsers){
                    _this.state.connections[node.name].username = node.rpcUsers.user;
                    _this.state.connections[node.name].password = node.rpcUsers.password;
                    
                }else{
                    _this.state.connections[node.name].username = defaultSettings.rpcUsers.user;
                    _this.state.connections[node.name].password = defaultSettings.rpcUsers.password;
                }
            }
        });
        
       this.handleChange = this.handleChange.bind(this);
       //this.startFlow = this.startFlow.bind(this);
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
        var evt = JSON.parse(event.data);
        var content = JSON.parse(evt.content);
        var result = JSON.parse(evt.result);

       
       //console.log("result: " + evt.result);
       //console.log("command received: " + evt.cmd);
       //console.log("returned content: " + evt.content);

       switch(evt.cmd){
           case "connect":
                clientrequest.loadNodeInfo(this.state.client)
                clientrequest.loadFlowInfo(this.state.client)
                clientrequest.loadTransactionHistory(this.state.client)
                clientrequest.loadStateNames(this.state.client)
        
                break;
           case "getNodeInfo":
                this.setState({
                    nodeInfo : content
                })
                break;
            case "getRegisteredFlows":
                this.setState({
                    flowNames : content
                })
                
                break;
            case "getRegisteredFlowParams":
                this.setState({
                    flowParams : content
                })
                break;
            case "getTransactionMap":
            case "userVaultQuery":
            case "vaultTrackResponse":
                this.setState({
                    transactionMap: Object.values(content)
                })
                break;
            case "getStateNames":
                this.setState({
                    stateNames: content
                })
                break;
            case "startFlow":
                switch(result.result){
                    case "Flow Started":
                            this.state.messages.push({content: "A flow of type " + content.flow + " started",
                                type: "info",
                                id: result.id
                            })
                            this.setState(this.state.messages);
                            break;
                    case "Flow Finished":
                            var objIndex = this.state.messages.findIndex((obj => obj.id == result.id));
                            if(objIndex != -1){
                            //Update object's name property.
                                this.state.messages[objIndex].type = "success"
                                this.state.messages[objIndex].content = "A flow of type " + content.flow + " finished"
                            } else{
                                this.state.messages.push({content: "A flow of type " + content.flow + " finished",
                                                        type: "success"
                                                        
                                })
                            }
                            this.setState(
                                    this.state.messages
                            )
                            break;
                    case "Flow Finished Exceptionally":
                            var objIndex = this.state.messages.findIndex((obj => obj.id == result.id));
                            if(objIndex != -1){
                            //Update object's name property.
                                this.state.messages[objIndex].type = "error"
                                this.state.messages[objIndex].content = "A flow of type " + content.flow + " finished exceptionally"
                            } else{
                                this.state.messages.push({content: "A flow of type " + content.flow + " finished exceptionally",
                                                        type: "error"
                                                        
                                })
                            }
                            this.setState(
                                    this.state.messages
                            )
                            break;
                }
                break;
            case "ERR":
                    this.state.messages.push({content: "An error occured: " + result.result,
                    type: "error"
                    })
                    this.setState(
                        this.state.messages
                    )
                    break;
       }
    }

    removeSnack(item){
        this.state.messages = this.state.messages.reverse();
        var index = this.state.messages.indexOf(item)
        if(index > -1) {
            this.state.messages.splice(index, 1);
        }
        this.state.messages = this.state.messages.reverse();
        this.setState(this.state.messages);
    }

    flushNode(){
        this.setState({
            nodeInfo : null,
            flowNames: [],
            flowParams:null,
            transactionMap: null
        })
       
    }

    handleChange(value){
        this.setState({
            selectedNode: value
        })
        if (value){
            clientrequest.chosenNode(this.state.client, this.state.connections[value])
        }else{
            this.flushNode()
        }
   }
   

   render() {
        if (this.state.client == null) {
            return (
                <div className="description-block">
                    Waiting for Node Server.
                    <div class="fa-3x">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                </div>
            )
        }
        if (this.props.viewType === "FlowExplorer") {
            return (
                <FlowExplorerView state = {this.state} handleChange = {this.handleChange} removeSnack = {this.removeSnack} />
            )
        }
        if (this.props.viewType === "VaultQuery") {
            return (
                <VaultQueryView state = {this.state} handleChange = {this.handleChange} removeSnack = {this.removeSnack} />
            )
        }
  }
}