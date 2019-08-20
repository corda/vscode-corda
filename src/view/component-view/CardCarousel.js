import React from 'react';
import NodeCard from './NodeCard';
import '../component-style/CardCarousel.css';

export default class CardCarousel extends React.Component {
    
    // TODO: Below 'nodes' is test data
    // eventually node - host,user,password will come through props
    constructor(props) {
        super(props);
        this.state = {
            //nodes: [1,2,3,4]
            nodes: 
            [
                {
                    host: "localhost:10009",
                    user: "user1",
                    pass: "test"
                },
                {
                    host: "localhost:10005",
                    user: "user1",
                    pass: "test"
                },
                {
                    host: "localhost:10013",
                    user: "user1",
                    pass: "test"
                }
            ]
            
        }
    }

    componentDidMount() {
        console.log(this.state.nodes)
        console.log(JSON.stringify(this.state.nodes))
        this.state.nodes.map((node) => console.log(node.host + " " + node.user + " " + node.pass))
        
    }

    render() {
        return (
            <div className="node-tray">
                {this.state.nodes.map((node) => (
                    <NodeCard host={node.host} username={node.user} password={node.pass}></NodeCard>
                ))}
            </div>
        );
    }
}