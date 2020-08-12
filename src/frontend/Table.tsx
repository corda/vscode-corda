import * as React from 'react';
import './Table.css';
import { LogEntry, LogSeverity } from "../backend/types";
const { Table, Thead, Tbody, Tr, Th, Td } = require("react-super-responsive-table");

export const FlexTable = (props: {logentries: LogEntry[]}) => (
  <Table>
    <Thead>
      <Tr>
        <Th>Severity</Th>
        <Th>Date</Th>
        <Th>Thread</Th>
        <Th>Source</Th>
        <Th>Message</Th>
        <Th>Object</Th>
      </Tr>
    </Thead>
    <Tbody>
    {props.logentries.map(entry => (
      <Tr key={JSON.stringify(entry)}>
        <Td>{severityToSymbol(entry.severity)}</Td>
        <Td>{entry.date}</Td>
        <Td>{entry.thread}</Td>
        <Td>{entry.source}</Td>
        <Td>{entry.body.message}</Td>
        <Td>{JSON.stringify(entry.body.object)}</Td>
      </Tr>
    ))}
    </Tbody>
  </Table>
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