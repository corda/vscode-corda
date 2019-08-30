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


    }

    static getDerivedStateFromProps(props){
        return {
            metaData : props.metaData,
            stateData : props.stateData
        }
    }



   

    
    render() {
        
        return(
           <Card className="state-card">
               <CardHeader
                
               
                title= {this.state.metaData.stateType}
                subheader={this.state.metaData.stateRef}
            />
               <CardContent>
                   {Object.keys(this.state.stateData).map(property => (
                       <div>
                           <em> {property}</em> : {JSON.stringify(this.state.stateData[property])}
                       </div>

                   ))}
               </CardContent>
           </Card>
        );
    }
}