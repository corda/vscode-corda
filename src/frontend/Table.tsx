import * as React from 'react';
//import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table';
import 'react-super-responsive-table/dist/SuperResponsiveTableStyle.css'
import './Table.css';

const { Table, Thead, Tbody, Tr, Th, Td } = require("react-super-responsive-table");


export default function TableExample(props: any) {
  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Flow entries</Th>
          <Th>Time</Th>
          <Th>Message</Th>
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td>'[INFO ] 2020-07-09T08:49:21,611Z [Node thread-1] corda.flow. - No need to notarise this transaction. </Td>
          <Td>15</Td>
          <Td>Node A</Td>
        </Tr>
        <Tr>
          <Td>[INFO ] 2020-07-09T08:49:21,611Z [Node thread-1] corda.flow. - No need to notarise this transaction.</Td>
          <Td>23</Td>
          <Td>Node B</Td>
        </Tr>
        <Tr>
          <Td>[INFO ] 2020-07-09T08:49:21,611Z [Node thread-1] corda.flow. - No need to notarise this transaction.</Td>
          <Td>10</Td>
          <Td>Node C</Td>
        </Tr>
        <Tr>
          <Td>[INFO ] 2020-07-09T08:49:21,611Z [Node thread-1] corda.flow. - No need to notarise this transaction.</Td>
          <Td>8</Td>
          <Td>Node D</Td>
        </Tr>
      </Tbody>
    </Table>
  )
}