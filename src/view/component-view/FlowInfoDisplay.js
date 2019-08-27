import React from 'react';
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
          flowParams: {},
          flowValues: {}
        }

        this.startFlow = this.startFlow.bind(this);
        this.changeParamHandler = this.changeParamHandler.bind(this);
    }

    startFlow(flow){
        const { startFlow } = this.props;
        startFlow(flow, this.state.flowValues[flow]);
    }
    changeParamHandler(flow,label, e){
        this.state.flowValues[flow][label] = e.target.value
        
    }

    static getDerivedStateFromProps(props){
        return {
            flowNames: props.flowNames ,
            flowParams: props.flowParams
        }
    }



    render() {
        console.log("Does it exist?")
        let re = /([^\.]*)$/g;
        console.log(JSON.stringify(this.state.flowParams))
        return(
            <Card className="flow-info-display-card">
                
                    {this.state.flowNames.map((flow) => {  
                        if(!this.state.flowValues[flow]){
                            this.state.flowValues[flow] = {};
                        }
                        return(
                            <ExpansionPanel>
                                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                    {flow}
                                </ExpansionPanelSummary>
                                <ExpansionPanelDetails>
                                    <form>
                                        {this.state.flowParams[flow] && this.state.flowParams[flow].map((input,index) => (  
                                            <TextField className="flow-param-input-field" label={input.match(re)[0]} margin="dense"
                                                onChange = {(e) => this.changeParamHandler(flow, input.match(re)[0] + index, e)}
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
                                            <Button color="secondary" className="flow-run" variant="contained" onClick={() => this.startFlow(flow)}>
                                                Run Flow
                                            </Button> 
                                        </Grid>
                                    </form>
                                </ExpansionPanelDetails>  
                            </ExpansionPanel>);
                    })}
               
            </Card>
        );
    }
}