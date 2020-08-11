import * as React from "react";
import { Column, Row } from 'simple-flexbox';
import { LogEntry } from "../backend/types";
import SimpleTable from "./SimpleTable";
import TableExample from "./Table";


export const BlancasTable = (props: {logentries: LogEntry[]}) => (
  <Column flexGrow={1}>
    <Row horizontal='center'>
      <h1>LOG VIEWER</h1>
    </Row>
    <Row vertical='center'>
      <Column flexGrow={1} horizontal='center'>
        <h3> First Table </h3>
        <span> A minimal table where all the data is included </span>
      </Column>
      <Column flexGrow={1} horizontal='center'>
        <h3> Second Table </h3>
        <span> A responsive table with some styling using CSS </span>
      </Column>
    </Row>
    <SimpleTable logentries={props.logentries} />
    <TableExample />
  </Column>
);