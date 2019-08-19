import React from 'react';
import '../component-style/NodeCard.css';

export default class NodeCard extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            name: "PartyA",
            host: "localhost",
            port: "5000",
            time: "00:02:11",
            uptime: "5 hours",
            numTransactions: "800"
        }
    }

    componentDidMount() {
        
    }

    render() {
        return (
            <div className="node-card">
                <div className="party-name">{this.state.name}</div>
                <div className="divider"></div>
                <div className="node-host">{this.state.host}</div>
                <div className="node-port">{this.state.port}</div>
                <div className="node-time">{this.state.time}</div>
                <div className="node-uptime">{this.state.uptime}</div>
                <div className="node-num-transactions">{this.state.numTransactions}</div>
            </div>
        );
    }
}