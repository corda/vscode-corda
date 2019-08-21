import React from 'react';

import Konva from "konva";
import { Stage, Layer, Circle, Text, Group, Label, Tag } from "react-konva";

export default class IndividualNode extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            x : props.x,
            y : props.y,
            name: props.node.name,
            hostport: props.node.hostport,
            serial:props.node.serial,
            platform:props.node.platform

        }
        this.showToolTip = this.showToolTip.bind(this);
        this.hideToolTip = this.hideToolTip.bind(this);
        console.log(props);
        
        
    }

    handleDragStart(e){
        var circles = e.target.getChildren(function(node){
          return node.getClassName() === 'Circle';
        });
        circles[0].setAttrs({
          shadowOffset: {
            x: 15,
            y: 15
          },
          scaleX: 1.1,
          scaleY: 1.1
        });
      };
      handleDragEnd (e){
        var circles = e.target.getChildren(function(node){
          return node.getClassName() === 'Circle';
        });
    
        circles[0].to({
          duration: 0.5,
          easing: Konva.Easings.ElasticEaseOut,
          scaleX: 1,
          scaleY: 1,
          shadowOffsetX: 5,
          shadowOffsetY: 5
        });
      };

      showToolTip(e){
        console.log(e.target.absolutePosition().x);
        const { showToolTip } = this.props;
        showToolTip(e.target.absolutePosition().x, e.target.absolutePosition().y);
      }

      hideToolTip(){
          const { hideToolTip } = this.props;
          hideToolTip();
      }

    render() {
        return (
            <Group
                      draggable
                      onDragStart={this.handleDragStart}
                      onDragEnd={this.handleDragEnd}
                      onMouseEnter={this.showToolTip}
                      onMouseLeave={this.hideToolTip}
                  >
                      <Circle 
                        class="nodeCircle" 
                        id="innerCi" 
                        x={this.state.x} 
                        y={this.state.y}
                        radius={50} 
                        fill='#FF0000'
                        shadowColor="black"
                        shadowBlur={10}
                        shadowOpacity={0.6}
                      
                        />
                        <Label
                           x={this.state.x} 
                           y={this.state.y}
                        >
                            <Tag 
                            fill= 'black'
                            pointerDirection= 'left'
                            pointerWidth= {20}
                            pointerHeight= {28}
                            lineJoin='round'
                            />
                            <Text text={this.state.name} x={this.state.x} y={this.state.y} fill="white" padding ={5}  />
                        </Label>
                        
                      
                      
                      
                  </Group>
        )
    }
    //<Text text={this.state.name} x={this.state.x} y={thisExpression.state.y}  />
}