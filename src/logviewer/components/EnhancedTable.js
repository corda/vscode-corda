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

import ListIcon from '@material-ui/icons/List';
import ListIconAlt from '@material-ui/icons/ListAlt';
import ArrowDown from '@material-ui/icons/ExpandMore';
import ArrowRight from '@material-ui/icons/ChevronRight';

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
      groupBy: ['thread']
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

  const cellClass = useStyles();
  
  return (
      <div className={cellClass.pageTitle}>
      <span>Log Viewer</span>
      <TableContainer>
      <TableToolbar
        preGlobalFilteredRows={preGlobalFilteredRows}
        setGlobalFilter={setGlobalFilter}
        globalFilter={globalFilter}
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
                  {column.canGroupBy ? (
                    <span {...column.getGroupByToggleProps()} style={{MarginTop: 8}}>
                      {column.isGrouped ? <ListIconAlt style={{fontSize: 14}}/> : <ListIcon style={{fontSize: 14}}/>}
                    </span>
                  ) : null}
                  {column.render('Header')}
                  {column.id !== 'message' ? (
                    <TableSortLabel
                      active={column.isSorted}
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
                    <TableCell {...cell.getCellProps()} classes={{ root: cellClass.cell }}>
                      {cell.isGrouped ? (
                        <>
                          <span {...row.getToggleRowExpandedProps()} style={{padding: 4}}>
                            {row.isExpanded ? <ArrowDown style={{fontSize: 14}}/> : <ArrowRight style={{fontSize: 14}}/>}
                          </span>{' '}
                          {cell.render('Cell')} ({row.subRows.length})
                        </>
                      ) : cell.isAggregated ? (
                        cell.render('Aggregated')
                      ) : cell.isPlaceholder ? null : (
                        cell.render('Cell')
                      )}
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
              colSpan={5}
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
