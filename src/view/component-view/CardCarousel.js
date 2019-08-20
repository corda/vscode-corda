import React from 'react';
import NodeCard from './NodeCard';
import '../component-style/CardCarousel.css';

export default class CardCarousel extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            nodes: [1,2,3,4]
        }
    }

    componentDidMount() {
        
    }

    render() {
        return (
            <div className="node-tray">
                {this.state.nodes.map((node,index)=>(
                            <NodeCard host={"localhost:10009"} username={"user1"} password={"test"}></NodeCard>
                ))}
            </div>
        );
    }
}