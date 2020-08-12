import * as React from 'react';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import { LogEntry, LogSeverity } from '../backend/types';


export const NonFlexTable = (props: {logentries: LogEntry[]}) => (
  <TableContainer component={Paper}>
    <Table aria-label="simple table">
      <TableHead>
        <TableRow>
          <TableCell align="center">Severity</TableCell>
          <TableCell align="center">Date</TableCell>
          <TableCell align="center">Thread</TableCell>
          <TableCell align="center">Source</TableCell>
          <TableCell align="center">Message</TableCell>
          <TableCell align="center">Object</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
          {props.logentries.map(entry => (
            <TableRow key={JSON.stringify(entry)}>
              <TableCell> {severityToSymbol(entry.severity)} </TableCell>
              <TableCell> {entry.date} </TableCell>
              <TableCell> {entry.thread} </TableCell>
              <TableCell> {entry.source} </TableCell>
              <TableCell> {entry.body.message} </TableCell>
              <TableCell> {JSON.stringify(entry.body.object)} </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  </TableContainer>
);


const severityToSymbol = (severity: LogSeverity) => {
  switch (severity) {
    case LogSeverity.WARN:
      return "( ! )";
    case LogSeverity.ERROR:
      return "(!!!)"
    case LogSeverity.INFO:
      return "( * )"
  }
}