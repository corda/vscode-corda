import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Select from '@material-ui/core/Select';
import Container from '@material-ui/core/Container';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';
import FormGroup from '@material-ui/core/FormGroup';

import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import AddIcon from '@material-ui/icons/Add';
import Fab from '@material-ui/core/Fab';
import DeleteIcon from '@material-ui/icons/Delete';
import { FormControl, FormLabel } from '@material-ui/core';

import Autosuggest from 'react-autosuggest';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';

import VQueryAutosuggest from "./VQueryAutosuggest";



const useStyles = makeStyles(theme => ({
  root: {
   // width: '100%',
   // maxWidth: 600
  },
  dropDown: {
    // fontSize: 14
  },
  textField: {
    // marginLeft: theme.spacing(1),
    // marginRight: theme.spacing(1),
    // width: '90%',
  },
  textFieldShort: {
    // marginLeft: theme.spacing(1),
    // marginRight: theme.spacing(1),
    // width: '15%',
  },
  textFieldInput: {
    //  fontSize: 10,
  }
}));

// PROPS: allNodes, contractStates
export default function VQueryBuilder(props) {
  const classes = useStyles();
  const [state, setState] = React.useState({
 
    timeCondition0: "NONE",
    timeCondition1: "",
    timeCondition2: "",
    stateRefOptions: [],
    stateRefSuggestions: [],

    // commented out predicates are for future use
    queryValues: {
      stateStatus: "ALL",       // CONSUMED/UNCONSUMED/ALL
      contractStateType: "",    // Array['contractState',...]
      stateRefs: "",            // Obj { hash:, index: }
      notary: "",               // Array['PartyA', 'PartyB', ...]
      //softLockingCondition: "",
      timeCondition: "",        // Obj { type: <RECORDED/CONSUMED>, start: 2017-05-24T10:30, end: 2017-05-24T10:30}
      relevancyStatus: "ALL",   // RELEVANT/NOT_RELEVANT/ALL
      //constraintTypes: "",
      //constraints: "",
      participants: ""          // Array['Notary1', ]
    }
  });

  // USED for all checkbox related predicates
  const handleChange = predicate => event => {

    const name = predicate.charAt(0).toLowerCase() + predicate.substring(1);
    const value = event.target.value;

    const currentIndex = state.queryValues[name].indexOf(value);
    var newChecked = [...state.queryValues[name]];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    if (newChecked.length === 0) newChecked = ""; // reset to default

    setState({ 
        ...state,
        queryValues: {
            ...state.queryValues,
            [name]: newChecked 
        }
    });
  }

  // dive down into transactionMap and fill StateRefOptions
  const fillStateRefOptions = () => {
      console.log("fillStateRefOptions")
      console.log("BEFORE stateRefOptions " + JSON.stringify(state.stateRefOptions))
      if (state.stateRefOptions.length === 0) {
        var srefs = []
        props.transactionMap.map((row) => {
            JSON.parse(row.states).map((stateRow) => {
                const sref = stateRow.second.stateRef;
                console.log(JSON.stringify("single sref " + sref))
                srefs.push(sref);
            })
        })
        console.log("SREFS " + JSON.stringify(srefs))
        setState({
            ...state,
            stateRefOptions: srefs
            })
    }
  }

  const stateRefList = () => {
    if(state.queryValues.stateRefs.length > 0) {
        return (
            state.queryValues.stateRefs.map(refs => {
                console.log(refs)
                return (
                    <ListItem key={refs["hash"]}>
                        <ListItemText primary={`ref: ${refs["hash"]} index: ${refs["index"]}`} />
                        <IconButton onClick={() => {
                                    const entryIndex = state.queryValues.stateRefs.indexOf(refs);
                                    var newStateRefs = [...state.queryValues.stateRefs];
                                    newStateRefs.splice(entryIndex, 1);
                                    if (newStateRefs.length === 0) newStateRefs = ""; // reset to default

                                    setState({ ...state,
                                        queryValues: {
                                            ...state.queryValues,
                                            stateRefs: newStateRefs 
                                        }
                                    });
                                }}>
                            <DeleteIcon size='small'/>
                        </IconButton>
                    </ListItem>
                )
            })
        )
    }
  }

  const stateRefEntry = () => {
   
      return (
            <div style={{display: 'inline-flex'}}>
           <VQueryAutosuggest stateRefOptions={state.stateRefOptions} setStateRefState={(hash, index) => {
                setState({
                    ...state,
                    queryValues: {
                        ...state.queryValues,
                        stateRefs: [...state.queryValues.stateRefs, {
                            "hash": hash,
                            "index": index
                        }]
                    }
                })
            }}
            />
            </div>
        
      )
  }

  const timeConditionEntry = () => {
    console.log("time conditions")
    console.log(state.timeCondition0)
    console.log(state.timeCondition1)
    console.log(state.timeCondition2)

    // set defaults if there is no entry BEFORE any onChange of the pickers
    if(state.queryValues.timeCondition === "") {
        setState({
            ...state,
            timeCondition1: "2017-05-24T10:30",
            timeCondition2: "2019-05-25T10:30",
            queryValues: {
                ...state.queryValues,
                timeCondition: { 
                    type: state.timeCondition0,
                    start: state.timeCondition1,
                    end: state.timeCondition2
                }
            }
        })
    } else if (
        state.timeCondition1 !== state.queryValues.timeCondition.start ||
        state.timeCondition2 !== state.queryValues.timeCondition.end
    ) {
        setState({
            ...state,
            queryValues: {
                ...state.queryValues,
                timeCondition: { 
                    ...state.queryValues.timeCondition,
                    type: state.timeCondition0,
                    start: state.timeCondition1,
                    end: state.timeCondition2
                }
            }
        })
    }
  }

  const startUserVaultQuery = () => {
        console.log("about to run startUserVaultQuery");
        props.startUserVaultQuery(state.queryValues);
    }

// component replacement for lifecycle componentDidUpdate()
React.useEffect(() => {
    console.log("state update! here");
    startUserVaultQuery();
    //fillStateRefOptions();
}, [state.queryValues]) // only if the following states are changed

  const contents = (predicate) => {
    
    switch(predicate) {
        case "StateStatus":
            return (
                <ListItem>
                    <FormControl>
                        <InputLabel 
                                htmlFor="state-status-selector" 
                                className="selection-box-label"
                                classes={{
                                    root:"selection-box-label",
                                    focused: "selection-box-label-focused",
                                    shrink: "selection-box-label-focused"
                                }}>
                                State Status
                            </InputLabel>
                        <Select
                            value={state.queryValues.stateStatus}
                            className='select-display'
                            //value={state.queryValues.stateStatus}
                            input={<Input classes={{underline: "selection-box-underline"}}/>}
                            classes = {{
                                icon: "selection-box-icon"
                            }}
                            inputProps={{
                                name: "party",
                                id: "state-status-selector",
                                classes: {
                                root: "selection-box-label"
                                }
                            }}
                            MenuProps={{ classes: { paper: "selection-box-dropdown" } }}

                            onChange={(event) => setState({
                                ...state,
                                queryValues: {
                                    ...state.queryValues,
                                    stateStatus: event.target.value
                                }
                            })}
                            >
                            <MenuItem value="UNCONSUMED">Unconsumed</MenuItem>
                            <MenuItem value="CONSUMED">Consumed</MenuItem>
                            <MenuItem value="ALL">ALL</MenuItem>
                        </Select>
                    </FormControl>
                </ListItem>
            ); 
        case "Notary": // if value.notary exists
        case "ContractStateType":
        case "Participants":
            var inputs = "";
            var statePropName = "";
            
            if (predicate === "ContractStateType") {
                inputs = props.contractStates;
                statePropName = "contractStateType";
            } else {

                // filter allNodes to relevant predicate
                if (predicate === "Notary") {
                    statePropName = "notary"
                    inputs = props.allNodes.filter(value => {
                        return value.notary;
                    })
                } else if (predicate === "Participants") {
                    statePropName = "participants"
                    inputs = props.allNodes.filter(value => {
                        return !value.notary;
                    })
                }
                // convert the incoming input <Party> to String representation
                inputs = inputs.map(value => {
                    return value.name.match("O=(.*),L")[1];
                })
            }
            return (
                <FormControl>
                <FormGroup>
                    
                    <FormLabel className="checkbox-label">
                                {predicate}
                    </FormLabel>
                    {inputs.map(value => {
                        const labelId = `list-label-${value}`
                        return (
                            <ListItem key={value} role={undefined} dense>
                           
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        onClick={handleChange(predicate)}
                                        value={value}
                                        checked={state.queryValues[statePropName].indexOf(value) !== -1}
                                        tabIndex={-1}
                                        disableRipple
                                        InputProps={{ 'aria-labelledby': labelId }}
                                        classes={{
                                            root: "checkbox-icon-root"
                                            
                                        }}
                                    />
                                </ListItemIcon>
                                <ListItemText id={labelId} primary={`${value}`} />
                                <ListItemSecondaryAction>
                                </ListItemSecondaryAction> 

                            </ListItem>
                        )
                    })}
                </FormGroup>
                </FormControl>
            )
        case "StateRef":
            console.log(state.stateRef2)
            return (
                <React.Fragment>
                    <ListItem>
                        {stateRefEntry()}
                    </ListItem>
                    {stateRefList()}
                </React.Fragment>
            )
        case "TimeCondition":
            return (
                <React.Fragment>
                    <ListItem>
                        <FormControl>
                            <InputLabel 
                                    htmlFor="time-condition-selector" 
                                    className="selection-box-label"
                                    classes={{
                                        root:"selection-box-label",
                                        focused: "selection-box-label-focused",
                                        shrink: "selection-box-label-focused"
                                    }}>
                                    Time Condition
                                </InputLabel>
                            <Select
                                value={state.timeCondition0}
                                //value={state.queryValues.stateStatus}
                                onChange={(event) => {
                                    if (event.target.value === "NONE")
                                    {
                                        setState({ ...state,
                                            timeCondition0: "NONE",
                                            queryValues: {
                                                ...state.queryValues,
                                                timeCondition: ""
                                            }
                                        });
                                    } else {
                                        setState({
                                            ...state,
                                            timeCondition0: event.target.value
                                        })
                                    }
                                }}
                                className='select-display'
                                input={<Input classes={{
                                    underline: "selection-box-underline"
                                }}/>}
                                classes = {{
                                    icon: "selection-box-icon"
                                }}
                                inputProps={{
                                    name: "party",
                                    id: "time-condition-selector",
                                    classes: {
                                    root: "selection-box-label"
                                    }
                                }}
                                MenuProps={{ classes: { paper: "selection-box-dropdown" } }}

                                >
                                <MenuItem value="NONE">None</MenuItem>
                                <MenuItem value="RECORDED">Recorded</MenuItem>
                                <MenuItem value="CONSUMED">Consumed</MenuItem>
                            </Select>
                        </FormControl>
                    </ListItem>
                    {/* HIDE Date/Time unless choosing dropdown */}
                    {(() => {
                        
                        if(state.timeCondition0 !== "NONE") {
                            timeConditionEntry(); // set states for timeCondition query
                            return (
                                <ListItem>
                                    <TextField
                                        id="datetime-local-start"
                                        label="Start"
                                        type="datetime-local"
                                        defaultValue="2017-05-24T10:30"
                                        InputLabelProps={{
                                        shrink: true,
                                        }}
                                        onChange={(event) => {
                                            setState({
                                                ...state,
                                                timeCondition1: event.target.value
                                            })
                                        }}
                                    />&nbsp;
                                    <TextField
                                        id="datetime-local-end"
                                        label="End"
                                        type="datetime-local"
                                        defaultValue="2019-05-25T10:30"
                                        InputLabelProps={{
                                        shrink: true,
                                        }}
                                        onChange={(event) => {
                                            console.log(event.target.id)
                                            setState({
                                                ...state,
                                                timeCondition2: event.target.value
                                            })
                                        }}
                                    />
                                    <IconButton // Deleting the entry resets
                                        onClick={() => {
                                            setState({ ...state,
                                                timeCondition0: "NONE",
                                                queryValues: {
                                                    ...state.queryValues,
                                                    timeCondition: ""
                                                }
                                            });
                                        }}>
                                        <DeleteIcon size='small'/>
                                    </IconButton>
                                </ListItem>
                            )
                    }})()}
                </React.Fragment>
            )
        case "Relevancy Status":
                return (
                    <ListItem>
                        <FormControl>
                             <InputLabel 
                                htmlFor="relevancy-status-selector" 
                                className="selection-box-label"
                                classes={{
                                    root:"selection-box-label",
                                    focused: "selection-box-label-focused",
                                    shrink: "selection-box-label-focused"
                                }}>
                                Relevancy Status
                            </InputLabel>
                            <Select
                                value={state.queryValues.relevancyStatus}
                                //value={state.queryValues.stateStatus}
                                onChange={(event) => setState({
                                    ...state,
                                    queryValues: {
                                        ...state.queryValues,
                                        relevancyStatus: event.target.value
                                    }
                                })}
                                className='select-display'
                                input={<Input classes={{
                                    underline: "selection-box-underline"
                                }}/>}
                                classes = {{
                                    icon: "selection-box-icon"
                                }}
                                inputProps={{
                                    name: "party",
                                    id: "relevancy-selector",
                                    classes: {
                                    root: "selection-box-label"
                                    }
                                }}
                                MenuProps={{ classes: { paper: "selection-box-dropdown" } }}

                                >
                                <MenuItem value="RELEVANT">Relevant</MenuItem>
                                <MenuItem value="NOT_RELEVANT">Not_Relevant</MenuItem>
                                <MenuItem value="ALL">All</MenuItem>
                            </Select>
                            </FormControl>
                    </ListItem>
                ); 
        default: return;
    }
      
  }

  return (
      <Container id="query-container">
        <List className={classes.root}>

        {/*Debug Statement*/}
        {fillStateRefOptions()}
        {console.log("current stateRefOptions" + JSON.stringify(state.stateRefOptions))}
        {console.log(state.queryValues)}
        {["StateStatus", "ContractStateType", "StateRef", "Notary",
         "Relevancy Status", "Participants"].map(value => {
            const labelId = `list-label-${value}`;
            const divKey = `${value}-div`

            return (
                
            <div key={divKey}>
                <ListItem key={value} >
                    <ListItemSecondaryAction>
                    </ListItemSecondaryAction>
                    
                </ListItem>
                {contents(value)}
                <p></p>
            </div>
            );
        })}
        </List>
    </Container>
  );
}