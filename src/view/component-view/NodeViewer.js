import React, { Component } from "react";
import Konva from "konva";
import { Stage, Layer, Circle, Text, Group } from "react-konva";
import '../component-style/NodeViewer.css';
import IndividualNode from "./IndividualNode";
import ToolTip from './ToolTip';

export default class NodeViewer extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            nodes: [{name: "PartyA",
            hostport: "localhost",
            serial: "XFXFSSFDF",
            platform: "4"},
            {name: "PartyA",
            hostport: "localhost",
            serial: "XFXFSSFDF",
            platform: "4"},
            {name: "PartyA",
            hostport: "localhost",
            serial: "XFXFSSFDF",
            platform: "4"}],
            tooltip: null

        }
        this.showToolTip = this.showToolTip.bind(this);
        this.hideToolTip = this.hideToolTip.bind(this);
    }

  showToolTip(x, y){
    this.setState({tooltip: x});
    console.log("tool tip should be displayed")
    console.log(this.state.tooltip);
  }

  hideToolTip(){
    this.setState({tooltip:null});
    console.log(this.state.tooltip);
  }
 
  render() {
    var x;
    var y;
    var toolDisplay = null;
    if(this.state.tooltip){
      var toolDisplay = <ToolTip contents = {this.state.tooltip} />;
      console.log("display set")
    } 
    return (
      <div>
        {toolDisplay}
        <Stage width={window.innerWidth} height={window.innerHeight}>
          <Layer>
              {this.state.nodes.map((node,index) => {
                  x=Math.random() * window.innerWidth
                  y=Math.random() * window.innerHeight
                
                  return(<IndividualNode x={x} y={y} node={node} showToolTip={this.showToolTip} hideToolTip={this.hideToolTip} />);
            })}
          </Layer>
        </Stage>
        
      </div>
    )
  }
}

