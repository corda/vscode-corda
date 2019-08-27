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
            nodeDetail: null
        }

        this.state.nodes = JSON.parse(document.getElementById('nodeList').innerHTML);
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
 
  switchNodeView(client){
    const { toggleToNodeExplorer } = this.props;
    toggleToNodeExplorer(client);
  }
  render() {
    var x;
    var y;
    var detailDisplay = null;
    if(this.state.nodeDetail){
      var detailDisplay = <DetailCard contents = {this.state.nodeDetail}/>;
    } 
    return (
      <div id="node-viewer">
        {detailDisplay}
        <Stage width={window.innerWidth} height={window.innerHeight}>
          <Layer>
              {this.state.nodes.map((node,index) => {
                  x=Math.random() * window.innerWidth
                  y=Math.random() * window.innerHeight
                  if(node.rpcUsers){
                    return(<IndividualNode x={x} y={y} node={node} showToolTip={this.showToolTip} hideToolTip={this.hideToolTip} switchNodeView={this.switchNodeView} />);
                  }
                })}
          </Layer>
        </Stage>
        
      </div>
    )
  }
}

