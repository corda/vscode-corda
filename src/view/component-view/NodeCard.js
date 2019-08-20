import React from 'react';
//import WebSocket from 'react-websocket';
import '../component-style/NodeCard.css';

const client = new WebSocket("ws://localhost:8080/session");

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

        // Setup websocket
        client.onopen = () => {
            client.send(JSON.stringify({"cmd":"getNodeInfo"}))
            console.log('Websocket client connected');
        }
        client.onmessage = (event) => {
            this.messageHandler(event);
        }
    }

    messageHandler(event) {
        console.log(event.data);
        // var evt = JSON.parse(event.data)
        // if (this.lastCmd == "getNodeInfo") {
        //     this.name = evt.legalIdentities;
        //     console.log("legal identity set")
        // } else {
        //     console.log("command was: " + this.lastCmd);
        // }
    }

    getNodeData() {
        // if (client.readyState) {
        //     client.send(JSON.stringify({
        //         "content":"this is a test"
        //     }))
        // }
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