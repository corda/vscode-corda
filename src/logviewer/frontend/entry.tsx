import * as React from 'react';
import { LogEntry } from '../backend/types';
import Collapsible from "react-collapsible";
import dropdownImg from "../../../media/dropdown.png"; 
import { isEmptyObject } from "../backend/util"
import { Col } from 'react-bootstrap';

export const EntryButton = (props: {entry: LogEntry, key: any}) =>
    <Collapsible 
        trigger={dropdownHeader(props.entry.severity.toString())} 
        key={props.key} 
        className={"Collapsible"}
    >
        <p> {props.entry.body.message} </p>
        <p> Spawned at time {props.entry.date.toISOString()} </p>
        <p> From task {props.entry.source} running on thread {props.entry.thread} </p>
        {makeCollapsible("Generated object", props.entry.body.object)}
    </Collapsible>


export const LoadingEntry = (props: {key: any}) =>
    <div key= {props.key}>
        . . . . . . . . . .
    </div>

const makeCollapsible = (name: string, object: any) => {
    if (typeof object !== "object") // string or number or whatever
        return <p> {name}: {object.toString()} </p>;
    
    const childNames = Object.keys(object);
    if (childNames.length === 1) 
        return <p> {childNames[0]}: {object[childNames[0]]} </p>;
    
    return (
        <Collapsible trigger={dropdownHeader(name)} key={name} className={"Collapsible"}>
            {childNames.map(childName => makeCollapsible(childName, object[childName]))}
        </Collapsible>
    );

}

const dropdownHeader = (header: string) =>
    <> 
        <img src={dropdownImg} style={{height: 15, width: 15}}/>
        {header}
    </>