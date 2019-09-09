import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import AddIcon from '@material-ui/icons/Add';
import Fab from '@material-ui/core/Fab';
import DeleteIcon from '@material-ui/icons/Delete';



const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: theme.palette.background.paper,
  },
  dropDown: {
    fontSize: 14
  },
  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: '90%',
  },
  textFieldShort: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: '15%',
  },
  textFieldInput: {
      fontSize: 10,
  }
}));

// PROPS: allNodes, contractStates
export default function VQueryBuilder(props) {
  const classes = useStyles();
  //const [checked, setChecked] = React.useState("");
  const [state, setState] = React.useState({
    stateRef0: "",
    stateRef1: "",
    stateRef2: false,
    timeCondition0: "NONE",
    timeCondition1: "",
    timeCondition2: "",

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
    const newChecked = [...state.queryValues[name]];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setState({ 
        ...state,
        queryValues: {
            ...state.queryValues,
            [name]: newChecked 
        }
    });
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
                                    const newStateRefs = [...state.queryValues.stateRefs];
                                    newStateRefs.splice(entryIndex, 1);

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
            <TextField
                id="standard-with-placeholder"
                label="Secure Hash"
                placeholder="CABC3C3F980BDA8F20D5F06EFCA1A2516ADB248AD05529405D89D76C4C088E37"
                className={classes.textField}
                onChange={(event) => {
                    setState({
                        ...state,
                        stateRef0: event.target.value
                    })
                }}
                margin="normal"
                value={state.stateRef0}
                error={state.stateRef0.length !== 64} // hash must be correct length
            />
            <TextField
                id="standard-with-placeholder"
                label="Index"
                placeholder="0"
                className={classes.textFieldShort}
                onChange={(event) => {
                    setState({
                        ...state,
                        stateRef1: event.target.value
                    })
                }}
                margin="normal"
                value={state.stateRef1}
                error={isNaN(state.stateRef1) || state.stateRef1.length === 0}
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

  const contents = (predicate) => {
    
    switch(predicate) {
        case "StateStatus":
            return (
                <ListItem>
                    <Select
                        value={state.queryValues.stateStatus}
                        //value={state.queryValues.stateStatus}
                        onChange={(event) => setState({
                            ...state,
                            queryValues: {
                                ...state.queryValues,
                                stateStatus: event.target.value
                            }
                        })}
                        className={classes.dropDown}
                        >
                        <MenuItem value="UNCONSUMED">Unconsumed</MenuItem>
                        <MenuItem value="CONSUMED">Consumed</MenuItem>
                        <MenuItem value="ALL">All</MenuItem>
                    </Select>
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
                <React.Fragment>
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
                                    />
                                </ListItemIcon>
                                <ListItemText id={labelId} primary={`${value}`} />
                                <ListItemSecondaryAction>
                                </ListItemSecondaryAction> 

                            </ListItem>
                        )
                    })}
                </React.Fragment>
            )
        case "StateRef":
            console.log(state.stateRef2)
            if ( // check when valid stateRef is entered via both fields
                state.stateRef0.length === 64 &&
                !isNaN(state.stateRef1) &&
                state.stateRef1.length > 0 &&
                state.stateRef2 === false
                ) {
                  setState({
                      ...state,
                      stateRef2: true
                  })
                }
            return (
                <React.Fragment>
                    <ListItem>
    
                        {stateRefEntry()}
                        {addButton()}
                        
                    </ListItem>
                    {stateRefList()}
                </React.Fragment>
            )
        case "TimeCondition":
            return (
                <React.Fragment>
                    <ListItem>
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
                            className={classes.dropDown}
                            >
                            <MenuItem value="NONE">None</MenuItem>
                            <MenuItem value="RECORDED">Recorded</MenuItem>
                            <MenuItem value="CONSUMED">Consumed</MenuItem>
                        </Select>
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
                            className={classes.dropDown}
                            >
                            <MenuItem value="RELEVANT">Relevant</MenuItem>
                            <MenuItem value="NOT_RELEVANT">Not_Relevant</MenuItem>
                            <MenuItem value="ALL">All</MenuItem>
                        </Select>
                    </ListItem>
                ); 
        default: return;
    }
      
  }

  const addButton = () => {
    if(state.stateRef2) {
        return (
            <Fab size='small' color="primary" aria-label="add" className={classes.fab}>
                <AddIcon onClick={() => {
                    const hash = state.stateRef0;
                    const index = state.stateRef1;
                    setState({
                        ...state,
                        stateRef0: "", // clear stateRef field
                        stateRef1: "", // clear stateRef field
                        stateRef2: false, // remove add button
                        queryValues: {
                            ...state.queryValues,
                            stateRefs: [...state.queryValues.stateRefs, {
                                "hash": hash,
                                "index": index
                            }]
                        }
                    })
                }} />
            </Fab>
        )
    } else return
  }

  return (
      
    <List className={classes.root}>

    {/*Debug Statement*/}
    {console.log(state.queryValues)}
      {["StateStatus", "ContractStateType", "StateRef", "Notary",
      "TimeCondition", "Relevancy Status", "Participants"].map(value => {
        const labelId = `list-label-${value}`;
        const divKey = `${value}-div`

        return (
            
        <div key={divKey}>
            <ListItem key={value} >
                <ListItemText id={labelId} primary={`${value}`} />
                <ListItemSecondaryAction>
                </ListItemSecondaryAction>
                
            </ListItem>
            {contents(value)}
            <p></p>
        </div>
        );
      })}
    </List>
  );
}