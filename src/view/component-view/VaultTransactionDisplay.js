import React from 'react';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import Paper from '@material-ui/core/Paper';
import TablePagination from '@material-ui/core/TablePagination';

export default class VaultTransactionDisplay extends React.Component {
  

    constructor(props) {
        super(props);
        this.state = {
            transactionMap : null,
            page: 0,
            rowsPerPage: 5
        }

        this.handleChangeRowsPerPage = this.handleChangeRowsPerPage.bind(this);
        this.handleChangePage = this.handleChangePage.bind(this);
        this.handleRowHover = this.handleRowHover.bind(this)
        
    }

    static getDerivedStateFromProps(props){
        return {
            transactionMap : props.transactionMap
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
   
    }


   

    
    render() {
        
        return(
            <div >
                <Table size="small" id="vault-info-display-table">
                  <TableHead>
                    <TableRow>
                      <TableCell>TimeStamp</TableCell>
                      <TableCell align="right">TxHash</TableCell>
                      <TableCell align="right">Num Of Outputs</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody id="vault-info-display-table-body">
                    {this.state.transactionMap.slice(this.state.rowsPerPage * this.state.page, this.state.rowsPerPage * this.state.page + this.state.rowsPerPage).map(row => {
                      
                        return(                       
                        <TableRow className="vault-info-display-table-row"
                        //onMouseEnter = {() => this.handleRowHover(row)}
                        >
                        <TableCell> {row.timeStamp} </TableCell>
                        <TableCell align="right">{row.txHash}</TableCell>
                        <TableCell align="right">There is: {Object.keys(JSON.parse(row.states)).length}</TableCell>
                      </TableRow>);
                    })}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  colSpan={3}
                  count={this.state.transactionMap.length}
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
          </div>
        );
    }
}