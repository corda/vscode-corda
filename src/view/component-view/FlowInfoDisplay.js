import React from 'react';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { TextField } from '@material-ui/core';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';

export default class FlowInfoDisplay extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
          flowNames :[],
          flowParams: {},
          flowValues: {},
          selectedFlow: "",
          selectedNode: props.selectedNode
        }

        this.startFlow = this.startFlow.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.changeParamHandler = this.changeParamHandler.bind(this);
        this.startFlow = this.startFlow.bind(this);
    }

    startFlow(flow){
        const { startFlow } = this.props;
        startFlow(flow, this.state.flowValues[flow]);
    }
    changeParamHandler(flow,label, e){
        if(!this.state.flowValues[flow]){
            this.state.flowValues[flow] = {}
        }
        this.state.flowValues[flow][label] = e.target.value
        
    }

    static getDerivedStateFromProps(props){
        return {
            flowNames: props.flowNames ,
            flowParams: props.flowParams,
            selectedNode: props.selectedNode
        }
    }


    handleChange(e){
        this.setState({
            selectedFlow: e.target.value
        })
   }
   
    render() {
        let re = /([^\.]*)$/g;
        let DisplayRunFlowButton = null;
        if(this.state.selectedFlow){
            DisplayRunFlowButton = <Button className="flow-run-button button-component" variant="contained" onClick={() => this.startFlow(this.state.selectedFlow)}>
                                          Run Flow
                                    </Button> 
        }
        return(
            <div>
                <Grid container justify="center" alignItems="center" >
                    <FormControl >
                                
                        <InputLabel 
                            htmlFor="flow-selector" 
                            className="selection-box-label"
                            classes={{
                                root:"selection-box-label",
                                focused: "selection-box-label-focused",
                                shrink: "selection-box-label-focused"
                              }}>
                            Choose A Flow To Run
                        </InputLabel>
                        <Select
                            value={this.state.selectedFlow}
                            onChange={this.handleChange}
                            className='select-display'
                            input={<Input classes={{
                                underline: "selection-box-underline"
                              }}/>}
                              classes = {{
                                  icon: "selection-box-icon"
                              }}
                            inputProps={{
                                name: "party",
                                id: "flow-selector",
                                classes: {
                                  root: "selection-box-label"
                                }
                              }}
                              MenuProps={{ classes: { paper: "selection-box-dropdown" } }}

                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            {this.state.flowNames.map((flow,index) => {
                                return (<MenuItem key={this.state.selectedNode + flow + "" + index} value={flow}>{flow}</MenuItem>)
                            
                            })}
                        </Select>
                    </FormControl>
                    </Grid>
                    <form className="flow-details-card" onSubmit={() => this.startFlow(this.state.selectedFlow)}>
                        {this.state.flowParams[this.state.selectedFlow] && this.state.flowParams[this.state.selectedFlow].map((input,index) => (  
                            <TextField key={this.state.selectedNode + this.state.selectedFlow + "" + index} className="flow-param-input-field input-field-text" label={input.match(re)[0]} margin="dense"
                                onChange = {(e) => this.changeParamHandler(this.state.selectedFlow, input.match(re)[0] + index, e)}
                                InputLabelProps={{
                                    classes: {
                                        root: "input-field-label",
                                        focused: "input-field-label-focused",
                                        shrink: "input-field-label-focused"
                                    },
                                }}
                                InputProps={{
                                    classes: {
                                        root: "input-field"
                                    },
                                }}
                            >

                            </TextField>
                        ))}    
                    
                    <Grid container alignItems="flex-start" justify="flex-end" direction="row">
                        {DisplayRunFlowButton}
                    </Grid>
                </form>
            </div>
        )
    }
}