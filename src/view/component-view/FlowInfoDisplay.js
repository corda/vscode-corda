import React from 'react';
//import WebSocket from 'react-websocket';
import '../component-style/FlowInfoDisplay.css';
import Card from '@material-ui/core/Card';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { ExpansionPanelSummary, ExpansionPanelDetails, ExpansionPanel, TextField } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

export default class NodeInfoDisplay extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
          flowDetails :[],
          inputs: ["Owner", "Amount", "Observer", "just", "way", "too", "much"]
        }
    }

    static getDerivedStateFromProps(props){
        console.log("UPDATING FLOW in flow details")
        console.log(JSON.stringify(props))
        return {
            flowDetails: props.content 
        }
    }



    render() {
        return(
            <Card className="flow-info-display-card">
                
                    {this.state.flowDetails.map((flow) => (  
                        <ExpansionPanel>
                            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                {flow}
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                <form>
                                    {this.state.inputs.map((input) => (  
                                        <TextField className="flow-param-input-field" label={input} margin="dense"
                                            InputLabelProps={{
                                                classes: {
                                                     root: "input-field-label",
                                                     focused: "input-field-label-focused",
                                                },
                                            }}
                                            InputProps={{
                                                classes: {
                                                    root: "input-field-focused"
                                                },
                                            }}
                                        >

                                        </TextField>
                                    ))}    
                                    <Grid container alignItems="flex-start" justify="flex-end" direction="row">
                                         <Button color="secondary" className="flow-run" variant="contained">Run Flow</Button> 
                                    </Grid>
                                </form>
                            </ExpansionPanelDetails>  
                        </ExpansionPanel>
                    ))}
               
            </Card>
        );
    }
}