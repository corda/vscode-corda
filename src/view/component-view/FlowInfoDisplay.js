import React from 'react';
import Autosuggest from 'react-autosuggest';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { TextField } from '@material-ui/core';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';

export default class FlowInfoDisplay extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
          flowNames :[],
          flowParams: {},
          flowValues: {},
          selectedFlow: "",
          selectedNode: props.selectedNode,
          options : props.options,
          suggestions : []
        }

        this.startFlow = this.startFlow.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.changeParamHandler = this.changeParamHandler.bind(this);
        this.startFlow = this.startFlow.bind(this);
        this.getSuggestions = this.getSuggestions.bind(this);
        this.getSuggestionValue = this.getSuggestionValue.bind(this);
        this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
        this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
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

   getSuggestions(value, type) {
   
    const inputValue = value.trim().toLowerCase()
    const inputLength = inputValue.length;
    return inputLength === 0 || !this.state.options[type]
      ? []
      : this.state.options[type].filter(
          item => item.value.toLowerCase().slice(0, inputLength) === inputValue
        );
    }

    getSuggestionValue(suggestion) {
        return suggestion.value;
    }

    onChange(event, flow, label, newValue ){
        
        if(!this.state.flowValues[flow]){
            this.state.flowValues[flow] = {}
        }
        this.state.flowValues[flow][label] = newValue
        this.setState(
            this.state.flowValues
        ); 
    };

    onSuggestionsFetchRequested(event, type) {
        console.log(JSON.stringify(event.value))
        this.setState({
          suggestions: this.getSuggestions(event.value, type)
        });
      }

    onSuggestionsClearRequested(){
        this.setState({
          suggestions: []
        });
    };

    renderSuggestion(suggestion,{ query, isHighlighted }) {
        const matches = match(suggestion.label, query);
        const parts = parse(suggestion.label, matches);
      
        return (
          <MenuItem selected={isHighlighted} component="div">
            <div>
              {parts.map(part => (
                <span key={part.text} style={{ fontWeight: part.highlight ? 500 : 400 }}>
                  {part.text}
                </span>
              ))}
            </div>
          </MenuItem>
        );
      }

      renderInputComponent(inputProps) {
        const { classes, inputRef = () => {}, ref, ...other } = inputProps;
      
        return (
          <TextField
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
              inputRef: node => {
                ref(node);
                inputRef(node);
              },
              
            }}
            {...other}
          />
        );
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
                        {this.state.flowParams[this.state.selectedFlow] && this.state.flowParams[this.state.selectedFlow].map((input,index) => { 
                            console.log("Did Update")
                            const val = this.state.flowValues[this.state.selectedFlow] &&  this.state.flowValues[this.state.selectedFlow][input.first.match(re)[0] + index] ? this.state.flowValues[this.state.selectedFlow][input.first.match(re)[0] + index] : ""
                            return(<Autosuggest
                                    suggestions={this.state.suggestions}
                                    onSuggestionsFetchRequested={(e) =>{
                                    this.onSuggestionsFetchRequested(e, input.first.match(re)[0])
                                    }}
                                    onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                                    getSuggestionValue={this.getSuggestionValue}
                                    renderSuggestion={this.renderSuggestion}
                                    
                            
                                    inputProps={{
                                        className: "flow-param-input-field input-field-text",
                                        label: input.second + ": " + input.first.match(re)[0],
                                        value: val,
                                        onChange: (e, { newValue }) => {this.onChange(e,this.state.selectedFlow, input.first.match(re)[0] + index, newValue )}
                                    }}
                                    renderInputComponent = {this.renderInputComponent}
                                    theme={{
                                        suggestionsContainerOpen : "menu-item-autosuggest",
                                        suggestionsList: "menu-item-autosuggest-list",
                                        container : "menu-item-autosuggest-container"

                                    }}

                                />)
                            /*<TextField key={this.state.selectedNode + this.state.selectedFlow + "" + index} className="flow-param-input-field input-field-text" label={input.second + ": " + input.first.match(re)[0]} margin="dense"
                                onChange = {(e) => this.changeParamHandler(this.state.selectedFlow, input.first.match(re)[0] + index, e)}
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
                                fullWidth = {true}
                            >

                            </TextField>*/
                            })}    
                    
                    <Grid container alignItems="flex-start" justify="flex-end" direction="row">
                        {DisplayRunFlowButton}
                    </Grid>
                </form>
            </div>
        )
    }
}