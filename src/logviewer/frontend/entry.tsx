import * as React from 'react';
import { LogEntry, LogSeverity } from './types';
import Collapsible from "react-collapsible";
import dropdownImg from "../../../media/dropdown.png"; 
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import { createMuiTheme } from "@material-ui/core/styles";
import * as colours from "@material-ui/core/colors";
import { makeStyles, createStyles, Theme } from "@material-ui/core/styles";

const themeDefn = {
    palette: {
        primary: colours.red,
        secondary: colours.grey
    },
};

const useStyles = makeStyles((theme: Theme) => 
    createStyles({
        root: {
            flexGrow: 1,
            background: theme.palette.background.default
        },
        paper: {
            padding: theme.spacing(2),
            background: theme.palette.background.paper,
            textAlign: "center",
            color: theme.palette.text.primary
        }
    })
);


export const Entry = (props: {entry: LogEntry, key: any}) => 
    expandableObject(props.entry.severity.toString(), props.entry)
        

export const LoadingEntry = (props: {key: any}) =>
    <div key={props.key}>
        . . . . . . . . . .
    </div>


const expandableObject = (name: string, object: any) => {
    const keys = Object.keys(object);
    if (keys.length === 0 || typeof object !== "object" || object instanceof Date) {
        return tableWithRow(name, object);
    }
    if (keys.length === 1) {
        return tableWithRow(keys[0], object[keys[0]])
    }
    return <Collapsible
            trigger={dropdownHeader(name)}
            className="Collapsible"
        >
            {keys.map(key => expandableObject(key, object[key]))}
        </Collapsible>
}

    
const dropdownHeader = (header: string) =>
    <> 
        <img src={dropdownImg} style={{height: 15, width: 15}}/>
        {header}
    </>


const tableWithRow = (key: string, value: any) => 
    <table width="100%">
        <tbody>
            <tr>
                <td width="10%"> {key} </td>
                <td width="fill-content"> {isEmptyObject(value) ? "null" : value.toString()} </td>
            </tr>
        </tbody>
    </table>

const isEmptyObject = (object: any) =>
    Object.keys(object).length === 0 && !(object instanceof Date)