import React from 'react';
//import WebSocket from 'react-websocket';
import '../component-style/NodeCard.css';

export default class NodeCard extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            name: "PartyA",
            hostport: "localhost",
            serial: "XFXFSSFDF",
            platform: "4"
        }
        
        this.client = new WebSocket("ws://localhost:8080/session");
        this.messageHandler = this.messageHandler.bind(this);

        // set event handler for websocket
        this.client.onmessage = (event) => {
            this.messageHandler(event);
        }
    }

    messageHandler(event) {
    
        var evt = JSON.parse(event.data);
        var content = JSON.parse(evt.content);

        console.log("command received: " + evt.cmd);
        console.log("returned content: " + evt.content);

        if (evt.cmd == "getNodeInfo") {
           console.log("State BEFORE setState: " + JSON.stringify(this.state))
            this.setState({
                name: content.legalIdentities,
                hostport: content.addresses,
                serial: content.serial,
                platform: content.platformVersion
            });

            console.log("State after setState: " + JSON.stringify(this.state));
        }
    }

    componentDidMount() {
        // propagate initial node info
        this.client.onopen = () => {
            this.client.send(JSON.stringify({"cmd":"getNodeInfo","content":JSON.stringify(this.props)}));
            this.client.send(JSON.stringify({"cmd":"garbage command"}));
        }
        console.log("State in componentDidMount: " + JSON.stringify(this.state))
    }

    render() {
        return (
            <div className="node-card">
                <div className="party-name">{this.state.name}</div>
                <div className="divider"></div>
                <div className="node-host-port">host: {this.state.hostport}</div>
                <div className="node-time">serial: {this.state.serial}</div>
                <div className="node-uptime">platform: {this.state.platform}</div>
            </div>
        );
    }
}