import React from 'react';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';

export default class StateCard extends React.Component {
  

    constructor(props) {
        super(props);
        this.state = {
            allNodes : props.allNodes,
            selectedNode: ""
          
        }

        this.handleChange = this.handleChange.bind(this)


    }

    static getDerivedStateFromProps(props){
        return {
            metaData : props.metaData,
            stateData : props.stateData
        }
    }


    handleChange(e){
        this.setState({
            selectedNode: e.target.value
        })
        const { handleChange } = this.props;
        handleChange(e.target.value)
        
   }



   

    
    render() {
        let re = /(?<=O=)[^,]*/g;

        return(
            <FormControl >
                        
            <InputLabel 
                htmlFor="node-selector" 
                classes={{
                    root:"selection-box-label",
                    focused: "selection-box-label-focused",
                    shrink: "selection-box-label-focused"
                  }}>
                    Choose A Node To Explore
            </InputLabel>
            <Select
                value={this.state.selectedNode}
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
                    id: "node-selector",
                    classes: {
                      root: "selection-box-label"
                      }
                  }}
                  MenuProps={{ classes: { paper: "selection-box-dropdown" } }}
            >
                <MenuItem value={null}>
                    <em>None</em>
                </MenuItem>
                {this.state.allNodes.map((node,index) => {
                    if(!node.notary){
                        return (<MenuItem key={"node" + index} value={node.name}>{node.name.match(re)[0]}</MenuItem>)
                    }
                })}
            </Select>
            </FormControl>
        );
    }
}