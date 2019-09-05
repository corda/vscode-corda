import React from 'react';


export default class NodeInfo extends React.Component {
  

    constructor(props) {
        super(props);
        this.state = {
            nodeInfo : props.nodeInfo
          
        }


    }

    static getDerivedStateFromProps(props){
        return {
            nodeInfo : props.nodeInfo
        }
    }



   

    
    render() {
        
        return(
            <div className="description-block"> 
                <div>Legal Identity : {this.state.nodeInfo.legalIdentities}</div>
                <div>Addresses : {this.state.nodeInfo.addresses} </div>
                <div>Serial : {this.state.nodeInfo.serial} </div>
                <div>Platform Version : {this.state.nodeInfo.platformVersion} </div>
            </div>
        );
    }
}