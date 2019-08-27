import React, { Component } from "react";
import "../component-style/NodeExplorer.css";
import NodeInfoDisplay from "./NodeInfoDisplay";
import FlowInfoDisplay from "./FlowInfoDisplay";
import Grid from '@material-ui/core/Grid';
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
        flowParams: {}
       }
       this.toggleToNodeViewer = this.toggleToNodeViewer.bind(this);
       this.messageHandler = this.messageHandler.bind(this);
       // set event handler for websocket
       this.state.client.onmessage = (event) => {
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
               nodeDetails : {name: content.legalIdentities,
                              hostport: content.addresses,
                              serial: content.serial,
                              platform: content.platformVersion }
           });
       }
       
       if(evt.cmd == "getRegisteredFlows"){
         console.log("updating the flow")
         this.setState({
            flowNames : content
         })
       }



       if(evt.cmd === "getStateNames"){
         console.log("state name")
         console.log(JSON.stringify(content))
       }

       if(evt.cmd === "getRegisteredFlowParams"){
         console.log("got the params")
         this.setState({
           flowParams : content
         })
       }
       
   }

   componentDidMount(){
    //this.state.client.send(JSON.stringify({"cmd": "getRegisteredFlowParams"}))
    this.state.client.send(JSON.stringify({"cmd":"getNodeInfo"}));
    this.state.client.send(JSON.stringify({"cmd": "getRegisteredFlows"}))
    this.state.client.send(JSON.stringify({"cmd": "getStateNames"}))
    this.state.client.send(JSON.stringify({"cmd": "getRegisteredFlowParams"}))
   }

   toggleToNodeViewer(){
     console.log("clicked");
     const { toggleToNodeViewer } = this.props;
     toggleToNodeViewer();
   }

  render() {
    let DisplayNodeDetails = null
    if(this.state.nodeDetails){
      DisplayNodeDetails = <div>{this.state.nodeDetails.name}</div>
    }
    //        <span onClick={this.toggleToNodeViewer} class="return-button"><i class="fas fa-arrow-left return-icon fa-lg" ></i> </span>
// 
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
                    fill='#FF0000'
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
          <Grid item xs={4}>
            <NodeInfoDisplay content = {this.state.nodeDetails} /> 

          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <FlowInfoDisplay flowNames = {this.state.flowNames} flowParams = {this.state.flowParams} />
          </Grid>
        </Grid>
      </div>
    )
  }
}
