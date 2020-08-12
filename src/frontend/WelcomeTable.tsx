import * as React from "react";
import { Column, Row } from 'simple-flexbox';

export const WelcomeTable = () => (
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
  </Column>
);