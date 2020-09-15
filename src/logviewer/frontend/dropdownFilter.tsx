import React from "react";
import {LogSeverity} from "./types";

const { DropdownButton } = require("react-bootstrap/src/DropdownButton");
const Dropdown = require("react-bootstrap/Dropdown");

export const DropdownFilter = (props: {filter: (severity: LogSeverity) => void}) => 
    <DropdownButton id="dropdown-basic-button" title="Filter by...">
        {[LogSeverity.INFO, LogSeverity.WARN, LogSeverity.ERROR].map(
            severity => (
                <Dropdown.Item onClick={() => props.filter(severity)}>
                    {severity.toString()}
                </Dropdown.Item>
            )
        )}
    </DropdownButton>