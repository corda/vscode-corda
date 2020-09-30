import React, { Component } from 'react';
import * as ReactDOM from 'react-dom';
import { ThemeProvider } from '@material-ui/core';
import { theme } from './theme'
import { Button, FormControl, Grid, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, FormHelperText } from '@material-ui/core';
import Modal from '@material-ui/core/Modal';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ForwardIcon from '@material-ui/icons/Forward';
import { vTxStartFlow, vTxFetchFlowList, vTxFetchTxList, vTxFetchParties } from './view_requests';

export class TransactionExplorer extends Component{
    state = {
        txProps: {},
        page: {
            pageSize: 10,
            offset: 0
        },
        flowInfo: {},
        selectedFlow: {},
        trnxDetail: [],
        paramList: []
    }

    constructor(props){
        super(props);
        this.state = {
            ...this.state,
            txProps: props
        }
        vTxFetchFlowList();
        vTxFetchTxList(this.state.page);
        vTxFetchParties();
    }

    componentDidUpdate() {
        if (this.state.txProps != this.props) {
            this.setState({
                ...this.state,
                txProps: this.props
            })
        }
    }

    loadFlowParams = (data) => {
        this.setState({
            ...this.state,
            txProps: {
                ...this.state.txProps,
                flowParams: data,
                flowResultMsg: "",
                flowResultMsgType: true
            }
        });
    }

    closeTxModal = () => {
        this.setState({
            ...this.state,
            txProps: {
                ...this.state.txProps,
                open: false,
                flowSelected: false,
                flowResultMsg: "",
                flowResultMsgType: true
            }
        });
    }

    openTxModal = () => {
        this.setState({
            ...this.state,
            txProps: {
                ...this.state.txProps,
                open: true
            }
        });
    }

    setFlowSelectionFlag = () => {
        this.setState({
            ...this.state,
            txProps: {
                ...this.state.txProps,
                flowSelected: true
            }
        });
    }

    inFlightFLow = (flag) => {
        this.setState({
            ...this.state,
            txProps: {
                ...this.state.txProps,
                flowInFlight: flag
            }
        });
    }

    handleClose = () => {
        this.setState({paramList: [], selectedFlow: {}})
        this.loadFlowParams([]);
        this.closeTxModal();
    }

    handleOpen = () => {
        this.openTxModal();
        this.loadFlowParams([]);
    }

    handleFlowSelection = (event) => {
        for(var i=0; i<this.state.txProps.registeredFlows.length;i++){
            const flow = this.state.txProps.registeredFlows[i];
            if(flow.flowName === event.target.value){
                this.loadFlowParams(flow.flowParamsMap.Constructor_1);
                this.setState({
                    selectedFlow: {
                        name: event.target.value,
                        constructors: flow.flowParamsMap,
                        activeConstructor: 'Constructor_1'
                    }
                });
                break;
            }
        }
        this.setFlowSelectionFlag();
    }

    handleFlowConstructorSelection = (event) => {   
        this.loadFlowParams(this.state.selectedFlow.constructors[event.target.value]);
        this.setState({
            selectedFlow: {
                name: this.state.selectedFlow.name,
                constructors: this.state.selectedFlow.constructors,
                activeConstructor: event.target.value
            }
        });
    }


    handleChangePage = (event, newPage) => {

        this.setState({
            page: {
                pageSize: 10,
                offset: newPage
            },
            trnxDetail: []
        }, this.loadNewPage);
        
    }

    loadNewPage = () => {
        vTxFetchTxList(this.state.page);
    }

    handleChangeRowsPerPage = (event) => {
        this.setState({
            page: {
                pageSize: event.target.value,
                offset: 0
            },
            trnxDetail: []
        }, this.loadNewPage);
    }

    prepareFlowDataToStart = () => {
        this.inFlightFLow(true);
        this.setState({
            flowInfo: {
                flowName: this.state.selectedFlow.name,
                flowParams: this.state.txProps.flowParams
            },
        }, () => vTxStartFlow(this.state.flowInfo));
    }

    showTrnxDetails = (trnx, index) => {
        let txDetail = this.state.trnxDetail;
        txDetail[index] = !this.state.trnxDetail[index]
        this.setState({
            trnxDetail : txDetail
        });
    }

    renderJson = (jsonObj, lvl) => {
        return(
            Object.keys(jsonObj).map((key, index) => {
                return (
                    jsonObj[key] ?
                    <div key={index} style={{marginLeft: lvl * 15, paddingBottom: lvl === 0?5:0}}>
                        {lvl === 0?
                        <span><strong>{key}: &nbsp;</strong></span>
                        :
                        <span>{key}: &nbsp;</span>
                        }

                        {typeof jsonObj[key] === 'object'?
                            this.renderJson(jsonObj[key], lvl+1)
                        :
                        jsonObj[key]}
                    </div>:null
                )
            }) 
        )
    }

    renderParamForm(innerForm, paramList, title, deep, delIdx, param, key){
        return(
            <React.Fragment>
            {
                innerForm? 
                    <div className="inner-form" style={{padding: deep? "10px 0px 0px 0px":  "10px 0"}} key={key}>
                        {
                            delIdx>=0?<div className="inner-form-close" onClick={()=> this.updateCmplxListParam(param, false, delIdx)}>X</div>:null
                        }
                        <div style={{padding: deep? 0:  "0 10px"}}>
                            <div style={{textTransform:"capitalize"}}><strong>{title}</strong></div>
                            {
                                paramList.map((param, index) => this.renderInnerForm(param, index, true))
                            }
                        </div>
                    </div>
                :
                this.state.txProps.flowParams?this.state.txProps.flowParams.map((param, index) => this.renderInnerForm(param, index, false)):null
            }
            </React.Fragment>
        );
    }

    renderInnerForm(param, index, deep){
        return(
            param.flowParams && param.flowParams.length > 1 && !(param.hasParameterizedType && (param.paramType === 'java.util.List' || param.paramType === 'java.util.Set'))? 
                this.renderParamForm(true, param.flowParams, param.paramName, deep)
            : // List of complex object
            param.flowParams && param.flowParams.length > 1 && (param.hasParameterizedType && (param.paramType === 'java.util.List' || param.paramType === 'java.util.Set'))? 
                <React.Fragment>
                    {/* {
                        this.renderParamForm(true, param.paramValue[0].params, param.paramName, deep, -1, param, -1)
                    }
                    {
                        this.state.paramList[param.paramName]?
                        this.state.paramList[param.paramName].map((value, idx) => {
                            return this.renderParamForm(true, value.params, param.paramName, deep, idx, param, value.key)
                        }):null
                    }
                    <div style={{cursor: "pointer"}} onClick={()=> this.updateCmplxListParam(param, true)}>Add</div> */}
                    <div style={{color: 'red', marginTop: 10}}>List of Complex Object is not supported</div>
                </React.Fragment>
            :
            <React.Fragment>   
            <div key={index} style={{width: "50%", float: "left", marginBottom: 5}}>
                {
                param.paramType === 'net.corda.core.identity.Party'?
                    <div style={{paddingRight: index%2===0? 5:0, paddingLeft: index%2===1? 5:0}}>
                        <FormControl fullWidth>
                            <InputLabel>{param.paramName}</InputLabel>
                                <Select onChange={e => {param.paramValue = e.target.value}} autoWidth>
                                    {
                                        this.state.txProps.parties.map((party, index) => {
                                            return(
                                                <MenuItem key={index} value={party}>{party}</MenuItem>
                                            );
                                        })
                                    }
                                </Select>
                                <FormHelperText>Select Party</FormHelperText>
                            </FormControl>
                    </div>
                :
                param.paramType === 'java.time.LocalDateTime' || param.paramType === 'java.time.Instant'?
                    <div style={{paddingRight: index%2===0? 5:0, paddingLeft: index%2===1? 5:0}}>
                        <TextField type="datetime-local" onBlur={e=> {param.paramValue = e.target.value}} label={param.paramName} InputLabelProps={{ shrink: true }} 
                        helperText={this.getHelperText(param.paramType)} fullWidth/> 
                    </div>
                :
                param.paramType === 'java.time.LocalDate'?
                    <div style={{paddingRight: index%2===0? 5:0, paddingLeft: index%2===1? 5:0}}>
                        <TextField type="date" onBlur={e=> {param.paramValue = e.target.value}} label={param.paramName} InputLabelProps={{ shrink: true }} fullWidth/> 
                    </div>
                :
                param.hasParameterizedType && (param.paramType === 'java.util.List' || param.paramType === 'java.util.Set') ?
                    this.renderListParam(param, index)
                :
                    <div style={{paddingRight: index%2===0? 5:0, paddingLeft: index%2===1? 5:0}}>
                        <TextField onBlur={e=> {param.paramValue = e.target.value}} label={param.paramName} helperText={this.getHelperText(param.paramType)} fullWidth/> 
                    </div>
                }
            </div> 
            {
                index%2 === 1? <div style={{clear: "both"}}></div>: null
            }
            </React.Fragment>
        );
    }

    renderListParam(param, index){
        return (
            <div style={{paddingRight: index%2===0? 5:0, paddingLeft: index%2===1? 5:0}}>
                {
                    param.parameterizedType === 'net.corda.core.identity.Party'?
                        <React.Fragment>
                            <FormControl fullWidth>
                                <InputLabel>{param.paramName}</InputLabel>
                                <Select onChange={e => this.updateListParam(param, e.target.value, true)} autoWidth>
                                    {
                                        this.state.txProps.parties.map((party, index) => {
                                            return(
                                                <MenuItem key={index} value={party}>{party}</MenuItem>
                                            );
                                        })
                                    }
                                </Select>
                                <FormHelperText>Select Parties</FormHelperText>
                            </FormControl>
                            {
                                this.state.paramList[param.paramName]?
                                this.state.paramList[param.paramName].map((value, idx) => {
                                        return (<div key={idx} className="list-selection">{value}<span onClick={()=>this.updateListParam(param, "", false, idx)}>X</span></div>)
                                    })
                                :null
                            }
                        </React.Fragment>
                    : param.parameterizedType === 'java.time.LocalDateTime' || param.parameterizedType === 'java.time.Instant'?
                        <React.Fragment>
                            <div style={{paddingRight: index%2===0? 5:0, paddingLeft: index%2===1? 5:0}}>
                                <TextField type="datetime-local" onBlur={e => this.updateListParam(param, e.target.value, true)} label={param.paramName} InputLabelProps={{ shrink: true }} 
                                helperText={this.getHelperText(param.paramType)} fullWidth/> 
                            </div>
                            {
                                this.state.paramList[param.paramName]?
                                this.state.paramList[param.paramName].map((value, idx) => {
                                        return (<div key={idx} className="list-selection">{value}<span onClick={()=>this.updateListParam(param, "", false, idx)}>X</span></div>)
                                    })
                                :null
                            }
                        </React.Fragment>    
                    :
                    param.parameterizedType === 'java.time.LocalDate'?
                        <React.Fragment>
                            <div style={{paddingRight: index%2===0? 5:0, paddingLeft: index%2===1? 5:0}}>
                                <TextField type="date" onBlur={e => this.updateListParam(param, e.target.value, true)} label={param.paramName} InputLabelProps={{ shrink: true }} fullWidth/> 
                            </div>
                            {
                                this.state.paramList[param.paramName]?
                                this.state.paramList[param.paramName].map((value, idx) => {
                                        return (<div key={idx} className="list-selection">{value}<span onClick={()=>this.updateListParam(param, "", false, idx)}>X</span></div>)
                                    })
                                :null
                            }
                        </React.Fragment>
                    :
                    param.hasParameterizedType && (param.paramType === 'java.util.List' || param.paramType === 'java.util.Set') ?
                        <div style={{color: 'red', marginTop: 10}}>Nested List Param is not supported!</div>
                    :
                        <React.Fragment>
                            <div style={{paddingRight: index%2===0? 5:0, paddingLeft: index%2===1? 5:0}}>
                               <TextField onBlur={e => this.updateListParam(param, e.target.value, true)} label={param.paramName} helperText={this.getHelperText(param.paramType)} fullWidth/> 
                            </div>
                            {
                                this.state.paramList[param.paramName]?
                                this.state.paramList[param.paramName].map((value, idx) => {
                                        return (<div key={idx} className="list-selection">{value}<span onClick={()=>this.updateListParam(param, "", false, idx)}>X</span></div>)
                                    })
                                :null
                            }
                        </React.Fragment>
                    }
            </div>
        );
    }

    updateListParam(param, val, flag, idx) {
        if(flag){
            if(param.paramValue === undefined || param.paramValue === null)
                param.paramValue = []
            
                param.paramValue.push(val);
                let keyVal = [];
                keyVal[param.paramName] = param.paramValue;
                this.setState({
                    paramList: keyVal
                });
        }else{
            param.paramValue.splice(idx, 1);
            this.state.paramList[param.paramName].splice(idx, 1)
            let keyVal = [];
            keyVal[param.paramName] = this.state.paramList[param.paramName];
            this.setState({
                paramList: keyVal
            });

        }
    }

    getHelperText(paramType){
        switch(paramType){
            case 'net.corda.core.contracts.Amount':
                return 'Param Type: ' + paramType + ' eg: 100 USD';
            
            case 'java.lang.Boolean':
            case 'boolean':
                return 'Param Type: ' + paramType + ' eg: true or false';
            
            case 'java.time.LocalDateTime':
            case 'java.time.Instant':    
                return 'Param Type: ' + paramType + ' eg: 10/02/2020 10:12:30 AM';

            case 'net.corda.core.utilities.OpaqueBytes':
                return 'Param Type: ' + paramType + ', Enter String value';

            default:
                return 'Param Type: ' + paramType;
        }
    }

    render(){
        return(
            <ThemeProvider theme={theme}>
            <div style={{padding: 20}}>
                <div className="page-title">
                    <span>Transaction Explorer</span>
                    <Button style={{float: "right"}} variant="contained" color="primary" onClick={this.handleOpen}>New Transaction</Button>
                    <Modal
                        open={this.state.txProps.open}
                        onClose={this.handleClose}
                        style={{overflow:"scroll"}}
                        >
                        <div className="paper">
                            <h3 id="simple-modal-title">Please Select a Flow to Execute</h3>
                            <div style={{color: "red"}}>{this.state.txProps.registeredFlows.length === 0? 'No Flows Found! Make sure you have the cordapp directory set in the Settings Tab':null}</div>
                            <div>
                            <div style={{width: "70%", float:"left"}}>
                                <FormControl style={{minWidth: 250, maxWidth:"100%", paddingRight: 10}}>
                                        <InputLabel id="flow-select-label">Select A Flow to Execute</InputLabel>
                                        <Select labelId="flow-select-label" onChange={this.handleFlowSelection}>
                                            {
                                                this.state.txProps.registeredFlows.map((flow, index) => {
                                                    return(
                                                        <MenuItem key={index} value={flow.flowName}>{flow.flowName}</MenuItem>
                                                    );
                                                })
                                            }
                                        </Select>
                                </FormControl>
                            </div>
                            {   
                                this.state.selectedFlow.constructors && Object.keys(this.state.selectedFlow.constructors).length>0?
                                <div style={{width: "30%", float: "left"}}>
                                    <FormControl style={{width:"100%"}}>
                                        <div style={{paddingLeft: 10}}>
                                        <InputLabel id="flow-cons-select-label" style={{paddingLeft: 10}}>Select A Constructor Type</InputLabel>
                                        <Select labelId="flow-cons-select-label" onChange={this.handleFlowConstructorSelection} 
                                        value={this.state.selectedFlow.activeConstructor} fullWidth>
                                            {
                                                Object.keys(this.state.selectedFlow.constructors).map((constructor, index) => {
                                                    return(
                                                        <MenuItem key={index} value={constructor}>{constructor}</MenuItem>
                                                    );
                                                })
                                            }
                                        </Select>
                                        </div>
                                    </FormControl>
                                </div>:null
                            }
                            </div>

                            <div>
                                {
                                    this.renderParamForm(false)
                                }
                                
                                        <div style={{width: "100%", float:"left", marginTop: 10, scroll: "auto"}}>
                                            {
                                            this.state.txProps.flowResultMsg    ?
                                                <div style={{float: "left", fontSize: 14}}>
                                                    <p style={{color: this.state.txProps.flowResultMsgType?"green":"red"}}>
                                                        <span>{this.state.txProps.flowResultMsgType?'Flow Successful :': 'Flow Errored :'}</span>
                                                        {this.state.txProps.flowResultMsg}
                                                    </p>
                                                </div>
                                                :null
                                            }
                                {
                                    this.state.txProps.flowSelected?
                                            <Button onClick={() => this.prepareFlowDataToStart()} style={{float: "right", marginTop: 10}} 
                                                    variant="contained" color="primary" disabled={this.state.txProps.flowInFlight}>
                                                {this.state.txProps.flowInFlight?'Please Wait...':'Execute'}
                                            </Button>
                                    :null
                                }
                                        </div>
                            </div>
                        </div>
                    </Modal>
                </div>
                <div>
                    <TableContainer>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell style={{width: 40}}></TableCell>
                                    <TableCell>Transaction Id</TableCell>
                                    <TableCell>Inputs</TableCell>
                                    <TableCell>Outputs</TableCell>
                                    <TableCell>Commands</TableCell>
                                </TableRow>    
                            </TableHead>
                            <TableBody>
                            {
                                this.state.txProps.transactionList && this.state.txProps.transactionList.length > 0 ?
                                this.state.txProps.transactionList.map((trnx, index) => {
                                    return (
                                        <React.Fragment>
                                            <TableRow key={index} style={{cursor: "pointer"}} onClick={() => this.showTrnxDetails(trnx, index)}
                                                className={this.state.trnxDetail[index]?"open":null}>
                                                <TableCell style={{width: 40}}>
                                                    {
                                                        this.state.trnxDetail[index]?
                                                        <ExpandLessIcon></ExpandLessIcon>:
                                                        <ExpandMoreIcon></ExpandMoreIcon> 
                                                    }
                                                </TableCell>
                                                <TableCell style={{fontSize: 12, maxWidth: 275}}>{trnx.transactionId}</TableCell>
                                                <TableCell>{trnx.inputTypes? trnx.inputTypes.map((typeCnt, index) => {
                                                    return ( <div key={index}> {typeCnt.type + "(" + typeCnt.count + ")" }</div>);
                                                }) :"-"}
                                                </TableCell>
                                                <TableCell>{trnx.outputTypes && trnx.outputTypes.length > 0 ? trnx.outputTypes.map((typeCnt, index) => {
                                                    return ( <div key={index}> {typeCnt.type + "(" + typeCnt.count + ")" }</div>);
                                                }) :"-"}
                                                </TableCell>
                                                <TableCell>{trnx.commands.map( command => {
                                                    return (<div>{command}</div>)
                                                        }
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                            {
                                                this.state.trnxDetail[index]?
                                                <TableRow style={{backgroundColor: 'var(--vscode-sideBar-background)'}}>
                                                    <TableCell colSpan="5">
                                                    <div style={{textAlign: "center", padding: "0 30px"}}>
                                                        <Grid container spacing={0}>
                                                            <Grid item xs={5}>
                                                                <div className="wrapper">
                                                                    <div className="wtitle">Inputs</div>
                                                                    {
                                                                        trnx.inputs?
                                                                        trnx.inputs.map((input, idx) => {
                                                                            return (
                                                                                <div className="content">
                                                                                    <div className="stitle">
                                                                                        <div>{input.type}</div>
                                                                                        <div style={{fontWeight: "normal", fontSize: 13}}>{input.stateRef.txhash} ({input.stateRef.index})</div>
                                                                                    </div>
                                                                                    {this.renderJson(input.state, 0)}
                                                                                </div>
                                                                            )
                                                                        }):
                                                                            <div className="content stripe"></div>
                                                                    }
                                                                </div>
                                                            </Grid>
                                                            <Grid item xs={2}>
                                                                <div className="cmd-wrapper">
                                                                    <ForwardIcon style={{color: "#DE0A1B", fontSize: 120}}></ForwardIcon>
                                                                    <div style={{position: "relative", top: -15}}>
                                                                        {trnx.commands.map( command => {
                                                                            return (<div>{command}</div>)
                                                                                }
                                                                            )
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </Grid>
                                                            <Grid item xs={5}>
                                                            <div className="wrapper">
                                                                <div className="wtitle">Outputs</div>
                                                                {
                                                                    trnx.outputs && trnx.outputs.length > 0?
                                                                    trnx.outputs.map((output, idx) => {
                                                                        return (
                                                                            <div className="content">
                                                                                <div className="stitle">
                                                                                    <div>{output.type}</div>
                                                                                    <div style={{fontWeight: "normal", fontSize: 13}}>{output.stateRef.txhash} ({output.stateRef.index})</div>
                                                                                </div>
                                                                                {this.renderJson(output.state, 0)}
                                                                            </div>    
                                                                        )
                                                                    }):<div className="content stripe"></div>
                                                                }
                                                            </div>
                                                            </Grid>
                                                            <Grid item xs={12}>
                                                            <div className="wrapper" style={{marginTop: 20, minWidth: "auto", height: "auto"}}>
                                                                <div className="wtitle">Signatures</div>
                                                                <div style={{padding: "10px", backgroundColor: "#FFFFFF", color: "#000000"}}>
                                                                    {
                                                                        trnx.signers && trnx.signers.length > 0?
                                                                        trnx.signers.map((sig, idx) => {
                                                                            return (
                                                                                <div>{sig.signature.bytes}<strong>({sig.partyName})</strong></div>
                                                                            )
                                                                        })
                                                                        :
                                                                        <div>Transaction has no signatures</div>
                                                                    }
                                                                </div>
                                                            </div>
                                                            </Grid>
                                                        </Grid>
                                                        
                                                    </div>
                                                    </TableCell>
                                                </TableRow>
                                                :""
                                            }
                                        </React.Fragment>
                                    );
                                })
                                : 
                                    <TableRow>
                                        <TableCell colSpan="5">No Data Found</TableCell>
                                    </TableRow>
                            }
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {
                    this.state.txProps.totalRecords?
                        <TablePagination
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        component="div"
                        count={this.state.txProps.totalRecords}
                        rowsPerPage={this.state.page.pageSize}
                        page={this.state.page.offset}
                        onChangePage={this.handleChangePage}
                        onChangeRowsPerPage={this.handleChangeRowsPerPage}
                        />
                        :null
                    }
                </div>
            </div>
            </ThemeProvider>
        );
    }
}