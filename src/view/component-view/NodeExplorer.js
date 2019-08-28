import React, { Component } from "react";
import "../component-style/NodeExplorer.css";
import NodeInfoDisplay from "./NodeInfoDisplay";
import FlowInfoDisplay from "./FlowInfoDisplay";
import VaultInfoDisplay from "./VaultInfoDisplay";
import StateHoverCard from "./StateHoverCard";
import Grid from '@material-ui/core/Grid';
import Hidden from '@material-ui/core/Hidden';

import { Circle, Text, Group, Label, Tag, Stage, Layer} from "react-konva";

export default class NodeExplorer extends React.Component {

    constructor(props) {
       super(props);
       this.state = {
         client: props.client,
         nodeDetails: {
          name: null,
          hostport: null,
          serial: null,
          platform: null
        },
        flowNames:[],
        flowParams: {},
        vaultItems: [],
        stateInfoHoverCard:{}
       }
       this.toggleToNodeViewer = this.toggleToNodeViewer.bind(this);
       this.toggleStateInfoDisplay = this.toggleStateInfoDisplay.bind(this);
       this.messageHandler = this.messageHandler.bind(this);
       this.startFlow = this.startFlow.bind(this);
       // set event handler for websocket
       this.state.client.onmessage = (event) => {
           this.messageHandler(event);
       }

       
       
   }

   messageHandler(event) {
   
       var evt = JSON.parse(event.data);
       var content = JSON.parse(evt.content);

      // console.log("command received: " + evt.cmd);
      // console.log("returned content: " + evt.content);

       if (evt.cmd == "getNodeInfo") {
           this.setState({
               nodeDetails : {name: content.legalIdentities,
                              hostport: content.addresses,
                              serial: content.serial,
                              platform: content.platformVersion }
           });
       }
       
       if(evt.cmd == "getRegisteredFlows"){
         this.setState({
            flowNames : content
         })
       }



       if(evt.cmd === "getStateNames"){
       }

       if(evt.cmd === "getStatesInVault"){
         this.setState({
           vaultItems : content
         })
         
        }

       if(evt.cmd === "getRegisteredFlowParams"){
         this.setState({
           flowParams : content
         })
       }
       
   }

   componentDidMount(){
    this.state.client.send(JSON.stringify({"cmd":"getNodeInfo"}));
    this.state.client.send(JSON.stringify({"cmd": "getRegisteredFlows"}))
    //this.state.client.send(JSON.stringify({"cmd": "getStateNames"}))
    this.state.client.send(JSON.stringify({"cmd" : "getStatesInVault"}))
    this.state.client.send(JSON.stringify({"cmd": "getRegisteredFlowParams"}))
   }

   toggleToNodeViewer(){
     const { toggleToNodeViewer } = this.props;
     toggleToNodeViewer();
   }

   toggleStateInfoDisplay(data){
      console.log("get more hover")
      this.setState({
        stateInfoHoverCard : data
      })
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

  render() {
    let DisplayNodeDetails = null
    var DisplayStateHoverCard = null
    if(this.state.nodeDetails){
      DisplayNodeDetails = <div>{this.state.nodeDetails.name}</div>
    }
    if(this.state.stateInfoHoverCard){
      DisplayStateHoverCard = <StateHoverCard hoverStateDetails ={this.state.stateInfoHoverCard} />
    }
  
   
    return (
      <div className="node-explorer-container">
        
         
        <Grid container spacing={4}>
          <Grid item xs={4}>
              <Stage width={200} height={100}><Layer>
                <Group
                  onClick={this.toggleToNodeViewer}
                >
                  <Circle 
                    class="nodeCircle" 
                    x={0} 
                    y={25}
                    radius={50} 
                    fill='#ec1d24'
                    shadowColor="black"
                    shadowBlur={10}
                    shadowOpacity={0.6}
                    
                          
                 />
                  <Label
                    x={0}
                    y={25}
                  >
                      <Tag 
                      fill= 'black'
                      pointerDirection= 'left'
                      pointerWidth= {20}
                      pointerHeight= {28}
                      lineJoin='round'
                      />
                      <Text text="Return to all nodes" x={0} fontFamily="FontAwesome" y={25} fill="white" padding ={5}  />
                      
                  </Label>
                </Group>
              </Layer></Stage>
          </Grid>
          <Grid item xs={6} md={4}>
            <NodeInfoDisplay content = {this.state.nodeDetails} /> 

          </Grid>
          <Hidden xsDown>
            <Grid item md={4} mdUp>
              {DisplayStateHoverCard }
            </Grid>
          </Hidden>
        </Grid>
        <Grid container spacing={3}>
          <Grid item sm={12} md={6}>
            <FlowInfoDisplay flowNames = {this.state.flowNames} flowParams = {this.state.flowParams} startFlow = {this.startFlow} />
          </Grid>
          <Grid item sm={12} md={6}>
            <VaultInfoDisplay vaultItems ={this.state.vaultItems} toggleStateInfoDisplay = {this.toggleStateInfoDisplay} />
          </Grid>
        </Grid>
      </div>
    )
  }
}
