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
          flowNames :[],
          flowParams: {}
        }
    }

    static getDerivedStateFromProps(props){
        return {
            flowNames: props.flowNames ,
            flowParams: props.flowParams
        }
    }



    render() {
        console.log("Does it exist?")
        console.log(JSON.stringify(this.state.flowParams))
        return(
            <Card className="flow-info-display-card">
                
                    {this.state.flowNames.map((flow) => (  
                        <ExpansionPanel>
                            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                {flow}
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                <form>
                                    {this.state.flowParams[flow] && this.state.flowParams[flow].map((input) => (  
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