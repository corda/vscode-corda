import * as React from 'react';
import { LogEntry, LogSeverity } from './types';
import Collapse from "react-bootstrap/Collapse";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import dropdownImg from "../../../media/dropdown.png"; 

export const Entry = (props: {entry: LogEntry, key: any}) => 
    expandableObject(props.entry.severity.toString(), props.entry)
        

export const LoadingEntry = (props: {key: any}) =>
    <div key={props.key}>
        . . . . . . . . . .
    </div>


const expandableObject = (name: string, object: any) => {
    const keys = Object.keys(object);
    if (keys.length === 0 || typeof object !== "object" || object instanceof Date) {
        return rowOf(name, object);
    }
    if (keys.length === 1) {
        return rowOf(keys[0], object[keys[0]])
    }
    return (
        <Expandable 
            header={name} 
            elements={keys.map(
                key => expandableObject(key, object[key])
            )}
            key={name + JSON.stringify(object)}
        />
    )
}

    
const Expandable = ({header, elements, key}) => {
    const [open, setOpen] = React.useState(false);
    const innerDivId = `key: ${key}`;
    return (
        <>
            <Button
                onClick={() => setOpen(!open)}
                aria-controls={innerDivId}
                aria-expanded={open}
            >
                {header}
            </Button>
            <Collapse in={open}>
                <div id={innerDivId}>
                    {elements}
                </div>
            </Collapse>
        </>
    )
}


const rowOf = (key: string, value: any) => 
    <Container>
        <Row>
            <Col sm={4}> {key} </Col>
            <Col sm={8}> {value.toString()} </Col>
        </Row>
    </Container>

const isEmptyObject = (object: any) =>
    Object.keys(object).length === 0 && !(object instanceof Date)