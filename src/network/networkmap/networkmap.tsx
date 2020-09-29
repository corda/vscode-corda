import React, { Component } from 'react';
import * as ReactDOM from 'react-dom';

import '../styles/Network.css';
import BoxWithTitle from '../components/BoxWithTitle';
import ListBoxWithTitle from '../components/ListBoxWithTitle';
import Pin from '../components/Pin';
import WorldMapSquare from './WorldMapSquare.png';
import { NetworkMap_Data, NetworkMap_Node } from '../types'

window.addEventListener("message", event => {
    const networkMapData = event.data as NetworkMap_Data;
    ReactDOM.render(
        <CordaNetwork {...networkMapData} />, 
        document.getElementById('root')
    );
})


class CordaNetwork extends Component<NetworkMap_Data>{
    private mapPane;

    componentDidMount() {
        this.update();
    }

    constructor(props: NetworkMap_Data){
      super(props);
      this.mapPane = React.createRef();
      this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
    }
  
    screenHeight = 0;
    screenWidth = 0;
    
    update(){
        this.forceUpdate();
        this.updateWindowDimensions();
    }
  
    updateWindowDimensions() {
      try{
        this.screenWidth = this.mapPane.current.clientWidth;
        this.screenHeight = this.screenWidth;
      }catch(e){}
    }
  
    getScreenXPos(posX){
        return this.screenWidth * (posX + 180) / 360 - 5;
    }
  
    getScreenYPos(posY){
        return this.screenHeight * (this.screenYRelative(posY) - 
            this.screenYRelative(85.05)) / (this.screenYRelative(-85.05) - this.screenYRelative(85.05)) - 5
    }
  
    screenYRelative = (pos) => {
        return Math.log(Math.tan(pos/ 360 * Math.PI + Math.PI/4))
    }
  
    handleImageLoaded = () => {
      this.updateWindowDimensions();
      window.addEventListener('resize', this.update.bind(this));
      let viewFrame = window.innerHeight - 60;
      let scroll = (this.screenHeight - viewFrame)/3;
      this.mapPane.current.scrollTop = scroll;
    }
  
    render(){
      return (
        <div style={{position: "relative", height:window.outerHeight, overflowY: "auto"}} ref={this.mapPane}>
          <img src={WorldMapSquare} alt="World Map" width="100%" onLoad={this.handleImageLoaded.bind(this)}></img>
          <div style={{position: "absolute", top: "0"}}>
            <div className="side-panel" style={{height:window.innerHeight - 60}}>
                <BoxWithTitle node={this.props.self}/>
                <ListBoxWithTitle list={this.props.notaries} title="Notaries"/>
                <ListBoxWithTitle list={this.props.peers} title="Peers"/>
            </div>
          </div>
  
          {
            this.props.self? 
            <Pin top={this.getScreenYPos(this.props.self.lat)} 
                  left={this.getScreenXPos(this.props.self.lng)} 
                  name={this.props.self.name}/>
            : null
          }
          {   
              this.props.notaries?
              this.props.notaries.map((node, index) => {
                return  <Pin key={index} top={this.getScreenYPos(node.lat)} 
                              left={this.getScreenXPos(node.lng)} 
                              name={node.name}/>
              }): null
          }
          {
              this.props.peers?
              this.props.peers.map((node, index) => {
                return  <Pin key={index}  top={this.getScreenYPos(node.lat)} 
                              left={this.getScreenXPos(node.lng)} 
                              name={node.name}/>
              }): null
          }
        </div>
      );
    }
  }

