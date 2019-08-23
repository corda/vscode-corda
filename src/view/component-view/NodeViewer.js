import React, { Component } from "react";
import Konva from "konva";
import { Stage, Layer, Circle, Text, Group } from "react-konva";
import '../component-style/NodeViewer.css';
import IndividualNode from "./IndividualNode";
import DetailCard from "./DetailCard";

export default class NodeViewer extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            nodes: [{name: "PartyA",
            hostport: "localhost",
            serial: "XFXFSSFDF",
            platform: "4",
            connection: {
              
                host: "localhost:10009",
                username: "user1",
                password: "test"
            
            }},
            {name: "PartyA",
            hostport: "localhost",
            serial: "XFXFSSFDF",
            platform: "4",
            connection: {
              
              host: "localhost:10006",
              username: "user1",
              password: "test"
          
          }},
            {name: "PartyA",
            hostport: "localhost",
            serial: "XFXFSSFDF",
            platform: "4",
            connection: {
              
              host: "localhost:10003",
              username: "user1",
              password: "test"
          
          }}],
            nodeDetail: null

        }
        this.showToolTip = this.showToolTip.bind(this);
        this.hideToolTip = this.hideToolTip.bind(this);
        this.switchNodeView = this.switchNodeView.bind(this);
    }

  showToolTip(nodeDetail){
    this.setState({nodeDetail: nodeDetail});
  }

  hideToolTip(){
    this.setState({nodeDetail:null});
  }
 
<<<<<<< HEAD
  switchNodeView(client){
    const { toggleToNodeExplorer } = this.props;
    toggleToNodeExplorer(client);
=======
  switchNodeView(){
    const { toggleNodeView } = this.props;
    toggleNodeView();
>>>>>>> 09103386bbfc1b525bbbe68f40616533bab4c3b2
  }
  render() {
    var x;
    var y;
    var detailDisplay = null;
    if(this.state.nodeDetail){
      var detailDisplay = <DetailCard contents = {this.state.nodeDetail}/>;
    } 
    return (
      <div>
        {detailDisplay}
        <Stage width={window.innerWidth} height={window.innerHeight}>
          <Layer>
              {this.state.nodes.map((node,index) => {
                  x=Math.random() * window.innerWidth
                  y=Math.random() * window.innerHeight
                
                  return(<IndividualNode x={x} y={y} node={node} showToolTip={this.showToolTip} hideToolTip={this.hideToolTip} switchNodeView={this.switchNodeView} />);
            })}
          </Layer>
        </Stage>
        
      </div>
    )
  }
}
