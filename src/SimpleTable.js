import * as React from 'react';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import { LogEntry } from "./types";

export const SimpleTable = (rows) => (
	<TableContainer component={Paper}>
		<Table aria-label="simple table">
			<TableHead>
				<TableRow>
					<TableCell>Flow Entries</TableCell>
					<TableCell align="right">Time</TableCell>
					<TableCell align="right">Message</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				{rows.map((row) => (
					<TableRow key={JSON.stringify(row)}>
						<TableCell component="th" scope="row">
							{row.severity}
						</TableCell>
						<TableCell align="right">{row.date}</TableCell>
						<TableCell align="right">{row.source}</TableCell>
						<TableCell align="right">{row.body.message}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	</TableContainer>
)

