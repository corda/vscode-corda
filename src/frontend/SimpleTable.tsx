import * as React from 'react';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import { LogEntry, LogSeverity } from '../backend/types';

function createData(name: string, time: number, message: string) {
    return { name, time, message };
}
  
const rows = [
  createData('[INFO ] 2020-07-09T08:49:21,611Z [Node thread-1] corda.flow. - No need to notarise this transaction. {actor_id=internalShell, actor_owning_identity=O=PartyA, L=London, C=GB, actor_store_id=NODE_CONFIG, fiber-id=10000001, flow-id=8ab75f57-0927-4e97-a867-404ffc85b820, invocation_id=d3cf42fd-9962-4af3-82a1-9a3f8a03e60d, invocation_timestamp=2020-07-09T08:49:15.305Z, origin=internalShell, session_id=71e2fe6f-3c90-43f5-b6de-1762d1216b95, session_timestamp=2020-07-09T08:49:14.963Z, thread-id=136, tx_id=347B67D3DBC1291894561C77394A596FEBC90CBB2286FE7858E6833FC8D84EE8}', 15, 'NodeA' ),
  createData('[INFO ] 2020-07-09T08:49:21,611Z [Node thread-1] corda.flow. - No need to notarise this transaction. {actor_id=internalShell, actor_owning_identity=O=PartyA, L=London, C=GB, actor_store_id=NODE_CONFIG, fiber-id=10000001, flow-id=8ab75f57-0927-4e97-a867-404ffc85b820, invocation_id=d3cf42fd-9962-4af3-82a1-9a3f8a03e60d, invocation_timestamp=2020-07-09T08:49:15.305Z, origin=internalShell, session_id=71e2fe6f-3c90-43f5-b6de-1762d1216b95, session_timestamp=2020-07-09T08:49:14.963Z, thread-id=136, tx_id=347B67D3DBC1291894561C77394A596FEBC90CBB2286FE7858E6833FC8D84EE8}', 23, 'NodeB'),
  createData('[INFO ] 2020-07-09T08:49:21,611Z [Node thread-1] corda.flow. - No need to notarise this transaction. {actor_id=internalShell, actor_owning_identity=O=PartyA, L=London, C=GB, actor_store_id=NODE_CONFIG, fiber-id=10000001, flow-id=8ab75f57-0927-4e97-a867-404ffc85b820, invocation_id=d3cf42fd-9962-4af3-82a1-9a3f8a03e60d, invocation_timestamp=2020-07-09T08:49:15.305Z, origin=internalShell, session_id=71e2fe6f-3c90-43f5-b6de-1762d1216b95, session_timestamp=2020-07-09T08:49:14.963Z, thread-id=136, tx_id=347B67D3DBC1291894561C77394A596FEBC90CBB2286FE7858E6833FC8D84EE8}', 10, 'NodeC'),
  createData('[INFO ] 2020-07-09T08:49:21,611Z [Node thread-1] corda.flow. - No need to notarise this transaction. {actor_id=internalShell, actor_owning_identity=O=PartyA, L=London, C=GB, actor_store_id=NODE_CONFIG, fiber-id=10000001, flow-id=8ab75f57-0927-4e97-a867-404ffc85b820, invocation_id=d3cf42fd-9962-4af3-82a1-9a3f8a03e60d, invocation_timestamp=2020-07-09T08:49:15.305Z, origin=internalShell, session_id=71e2fe6f-3c90-43f5-b6de-1762d1216b95, session_timestamp=2020-07-09T08:49:14.963Z, thread-id=136, tx_id=347B67D3DBC1291894561C77394A596FEBC90CBB2286FE7858E6833FC8D84EE8}', 8, 'NodeD'),
];


const SimpleTable = (props: {logentries: LogEntry[]}) => (
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

export default SimpleTable;