import React from "react";
import {LogSeverity, severityToName} from "./types";

import { DropdownButton } from "react-bootstrap"; 
import Dropdown from "react-bootstrap/Dropdown";

export const DropdownFilter = (props: {filter: (severity: LogSeverity) => void}) => 
    <DropdownButton id="dropdown-basic-button" title="Filter by...">
        {[LogSeverity.INFO, LogSeverity.WARN, LogSeverity.ERROR].map(
            severity => (
                <Dropdown.Item onClick={() => props.filter(severity)}>
                    {severityToName(severity)}
                </Dropdown.Item>
            )
        )}
    </DropdownButton>