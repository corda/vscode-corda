import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';


import '../component-style/FlowInfoDisplay.css';

export default class VaultInfoDisplay extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            vaultItems : []
        }

    }

    static getDerivedStateFromProps(props){
      console.log("Should be updating!")
        return {
            vaultItems : props.vaultItems
        }
    }

    

    render() {
        
        return(
            <Paper >
            <Table  size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ContractStates</TableCell>
                  <TableCell align="right">Origin</TableCell>
                  <TableCell align="right">Target</TableCell>
                  <TableCell align="right">Message</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {this.state.vaultItems.map(row => (
                  <TableRow>
                    <TableCell> YoState</TableCell>
                    <TableCell align="right">{row.origin.Organisation}</TableCell>
                    <TableCell align="right">{row.target.Organisation}</TableCell>
                    <TableCell align="right">{row.yo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        );
    }
}