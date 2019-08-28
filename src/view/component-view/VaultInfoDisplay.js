import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import Paper from '@material-ui/core/Paper';
import TablePagination from '@material-ui/core/TablePagination';


import '../component-style/VaultInfoDisplay.css';

export default class VaultInfoDisplay extends React.Component {
  

    constructor(props) {
        super(props);
        this.state = {
            vaultItems : [],
            page: 0,
            rowsPerPage: 5
        }
        this.handleChangeRowsPerPage = this.handleChangeRowsPerPage.bind(this);
        this.handleChangePage = this.handleChangePage.bind(this);
        this.handleRowHover = this.handleRowHover.bind(this)
    }

    static getDerivedStateFromProps(props){
        return {
            vaultItems : props.vaultItems
        }
    }

    handleChangeRowsPerPage(e){
        this.setState({
          rowsPerPage: parseInt(e.target.value,10),
          page: 0 
        })
    }

    handleChangePage(e,num){
      this.setState({
        page: num
      })
    }

    handleRowHover(data){
      console.log(JSON.stringify(data))
      const { toggleStateInfoDisplay } = this.props
      toggleStateInfoDisplay(data.origin)
    }


   

    
    render() {
        
        return(
            <Paper >
                <Table size="small" id="vault-info-display-table">
                  <TableHead>
                    <TableRow>
                      <TableCell>ContractStates</TableCell>
                      <TableCell align="right">Origin</TableCell>
                      <TableCell align="right">Target</TableCell>
                      <TableCell align="right">Message</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody id="vault-info-display-table-body">
                    {this.state.vaultItems.slice(this.state.rowsPerPage * this.state.page, this.state.rowsPerPage * this.state.page + this.state.rowsPerPage).map(row => (
                      <TableRow className="vault-info-display-table-row"
                        onMouseEnter = {() => this.handleRowHover(row)}
                      >
                        <TableCell> YoState</TableCell>
                        <TableCell align="right">{row.origin.Organisation}</TableCell>
                        <TableCell align="right">{row.target.Organisation}</TableCell>
                        <TableCell align="right">{row.yo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  colSpan={3}
                  count={this.state.vaultItems.length}
                  rowsPerPage={this.state.rowsPerPage}
                  page={this.state.page}
                  SelectProps={{
                    inputProps: { 'aria-label': 'rows per page' },
                    native: true,
                  }}
                  onChangePage={this.handleChangePage}
                  onChangeRowsPerPage={this.handleChangeRowsPerPage}
                  //ActionsComponent={TablePaginationActions}
              />      
          </Paper>
        );
    }
}