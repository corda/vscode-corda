import React from 'react';
import '../component-style/DetailCard.css';
export default class DetailCard extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            name: props.contents.name,
            legalIdentities: props.contents.legalIdentities,
            hostport: props.contents.hostport,
            serial: props.contents.serial,
            platform: props.contents.platform
        }
       
    }


    render() {
        return (
            <div className="detail-card">
                <div>Name: {this.state.name}</div>
                <div>Legal Identity: {this.state.legalIdentities}</div>
                <div>Hostport: {this.state.hostport} </div>
                <div>Serial: {this.state.serial} </div>
                <div>Corda Version: {this.state.platform} </div>
            </div>
        );
    }
}