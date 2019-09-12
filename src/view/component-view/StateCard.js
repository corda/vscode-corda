import React from 'react';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';

import { CardContent } from '@material-ui/core';


export default class StateCard extends React.Component {
  

    constructor(props) {
        super(props);
        this.state = {
            metaData : props.metaData,
            stateData : props.stateData
          
        }
     

        this.copyToClipboard = this.copyToClipboard.bind(this);
        this.updateClipboard = this.updateClipboard.bind(this)
        this.updateClipboard(props);

    }

    static getDerivedStateFromProps(props){
        return {
            metaData : props.metaData,
            stateData : props.stateData
        }
    }

    updateClipboard(props){
        if(props.stateData.linearId){
            this.state.linearID = Object.keys(props.stateData.linearId).map(function(key) {
                return props.stateData.linearId[key];
            })[0]
        } 
        this.state.stateRef = props.metaData.stateRef;
    }

    copyToClipboard(e, property){
        var textArea = document.createElement("textarea");
        textArea.value = this.state[property];
        textArea.style.width = "0px"
        textArea.style.height = "0px"
        this.stateCard.appendChild(textArea);
        textArea.select();

        try {
            var successful = document.execCommand('copy');
            var msg = successful ? 'successful' : 'unsuccessful';
            console.log('Copying text command was ' + msg);
        } catch (err) {
            console.log('Unable to copy');
        }

        this.stateCard.removeChild(textArea);
        
    }

   

    
    render() {
        const copyButton = <span> {this.state.metaData.stateRef}<span onClick={(e) => this.copyToClipboard(e, "stateRef")} class="copy-button-container">< i class="fas fa-copy copy-button" ></i> </span></ span>
        
        return(
           <Card className="state-card"  ref={(stateCard) => this.stateCard = stateCard}>
               <CardHeader
                
               
                title= {this.state.metaData.stateType}
                subheader={copyButton } 
            />

               <CardContent>
                   {Object.keys(this.state.stateData).map((property,index) => {
                       var copyButton = null;
                       if(property == "linearId"){
                            copyButton = <span onClick={(e) => this.copyToClipboard(e, "linearID")} class="copy-button-container">< i class="fas fa-copy copy-button" ></i> </span>
                       }
                       return(<div key={"stateProperty" + index}>
                           <em> {property}</em> : {JSON.stringify(this.state.stateData[property])} {copyButton}
                       </div>);

                   })}
               </CardContent>
           </Card>
        );
    }
}