import React from 'react'
import { makeStyles } from '@material-ui/core/styles';
import MaUTable from '@material-ui/core/Table'
import PropTypes from 'prop-types'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableFooter from '@material-ui/core/TableFooter'
import TableHead from '@material-ui/core/TableHead'
import TablePagination from '@material-ui/core/TablePagination'
import TablePaginationActions from './TablePaginationActions'
import TableRow from '@material-ui/core/TableRow'
import TableSortLabel from '@material-ui/core/TableSortLabel'
import TableToolbar from './TableToolbar'
import {
  useGlobalFilter,
  usePagination,
  useSortBy,
  useTable,
  useGroupBy,
  useExpanded,
} from 'react-table'


const useStyles = makeStyles({
  header: {
    padding: '8px',
    color: 'var(--vscode-editor-foreground)',
    background: 'var(--vscode-sideBarSectionHeader-background)'
  },
  cell: {
    padding: '4px',
    fontFamily: 'courier',
    color: 'var(--vscode-editor-foreground)',
  },  
  pageTitle: {
    height: '50px',
    color: 'var(--vscode-editor-foreground)',
    fontSize: '25px'
  },
  themeColor: {
    color: 'var(--vscode-editor-foreground)'
  }
});

const EnhancedTable = ({
  columns,
  data,
  setData,
  updateMyData,
  skipPageReset,
}) => {
  const {
    getTableProps,
    headerGroups,
    prepareRow,
    page,
    gotoPage,
    setPageSize,
    preGlobalFilteredRows,
    setGlobalFilter,
    state: { pageIndex, pageSize, globalFilter, groupBy, expanded, showInfo, showErrors },
  } = useTable(
    {
      columns,
      data,
      autoResetPage: !skipPageReset,
      updateMyData,
    },
    useGlobalFilter,
    useGroupBy,
    useSortBy,
    useExpanded,
    usePagination,
  )
  

  const handleChangePage = (event, newPage) => {
    gotoPage(newPage)
  }

  const handleChangeRowsPerPage = event => {
    setPageSize(Number(event.target.value))
  }

  const handleGroupChange = event => {
    //this.setState(groupBy, 'thread');
    console.log(event)
  }

  const handleInfoChange = event => {
    console.log(event)
  }

  const handleErrorsChange = event => {
    console.log(event)
  }

  const cellClass = useStyles();

  return (
    <div className={cellClass.pageTitle}>
    <span>Log Viewer</span>
    <TableContainer>
      <TableToolbar
        preGlobalFilteredRows={preGlobalFilteredRows}
        setGlobalFilter={setGlobalFilter}
        globalFilter={globalFilter}
        handleGroupChange={handleGroupChange}
        handleInfoChange={handleInfoChange}
        handleErrorsChange={handleErrorsChange}
      />
      <MaUTable {...getTableProps()}>
        <TableHead>
          {headerGroups.map(headerGroup => (
            <TableRow {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <TableCell 
                  classes={{ root: cellClass.header }}
                  {...(column.id === 'message'
                    ? column.getHeaderProps()
                    : column.getHeaderProps(column.getSortByToggleProps()))}
                  style={{ width: column.width, fontWeight: 600 }}
                >
                  {column.render('Header')}
                  {column.id !== 'message' ? (
                    <TableSortLabel
                      active={column.isSorted}
                      // react-table has a unsorted state which is not treated here
                      direction={column.isSortedDesc ? 'desc' : 'asc'}
                    />
                  ) : null}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {page.map((row, i) => {
            prepareRow(row)
            return (
              <TableRow {...row.getRowProps()}>
                {row.cells.map(cell => {
                  return (
                    <TableCell {...cell.getCellProps()} classes={{ root: cellClass.cell}}>
                      {cell.render('Cell')}
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>

        <TableFooter className={{root: cellClass.header}}>
          <TableRow>
            <TablePagination
              classes={{
                root: cellClass.themeColor,
                actions: cellClass.themeColor
              }}
              rowsPerPageOptions={[
                100,
                200,
                500,
                { label: 'All', value: data.length },
              ]}
              colSpan={4}
              count={data.length}
              rowsPerPage={pageSize}
              page={pageIndex}
              SelectProps={{
                inputProps: { 'aria-label': 'rows per page' },
                native: true,
              }}
              onChangePage={handleChangePage}
              onChangeRowsPerPage={handleChangeRowsPerPage}
              ActionsComponent={TablePaginationActions}
            />
          </TableRow>
        </TableFooter>
      </MaUTable>
    </TableContainer>
    </div>
  )
}

EnhancedTable.propTypes = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  updateMyData: PropTypes.func.isRequired,
  setData: PropTypes.func.isRequired,
  skipPageReset: PropTypes.bool.isRequired,
}

export default EnhancedTable
