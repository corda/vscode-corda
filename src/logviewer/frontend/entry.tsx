import * as React from 'react';
import { LogEntry, LogSeverities } from './types';
import Collapse from "react-bootstrap/Collapse";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import * as util from "./util";

export const Entry = (props: {entry: LogEntry, key: any}) => 
    expandableObject(props.entry.severity.toString(), props.entry)
        

export const LoadingEntry = (props: {key: any}) =>
    <div key={props.key}>
        . . . . . . . . . .
    </div>


const expandableObject = (header: any, object: any) => {
    const keys = Object.keys(object);
    if (keys.length === 0 || typeof object !== "object" || object instanceof Date) {
        return <KeyValueRow header={header} object={object} />
    }
    if (keys.length === 1) {
        return <KeyValueRow header={keys[0]} object={object[keys[0]]} />
    }
    return (
        <Expandable 
            header={header} 
            elements={keys.map(
                key => expandableObject(key, object[key])
            )}
            key={JSON.stringify(name) + JSON.stringify(object)}
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
                {format(header)}
            </Button>
            <Collapse in={open}>
                <div id={innerDivId}>
                    {elements}
                </div>
            </Collapse>
            <br />
        </>
    )
}


const KeyValueRow = ({header, object}) => {
    console.log(object);

    return (
        <Container>
        <Row>
            <Col sm={4}> {format(header)} </Col>
            <Col sm={8}> {format(object)} </Col>
        </Row>
    </Container>

    )
}
    
const format = (object: any) => {
    if (isEmptyObject(object))
        return "(empty)"

    if (object instanceof Date) 
        return util.before(object.toString(), " GMT")

    return object.toString()
}

const isEmptyObject = (object: any) =>
    Object.keys(object).length === 0 && !(object instanceof Date)