import React from "react";
import {LogSeverities, Severity} from "./types";

import { DropdownButton } from "react-bootstrap"; 
import Dropdown from "react-bootstrap/Dropdown";

export const DropdownFilter = (props: {filter: (severity: Severity) => void}) => 
    <DropdownButton id="dropdown-basic-button" title="Filter by...">
        {[LogSeverities.INFO, LogSeverities.WARN, LogSeverities.ERROR].map(
            severity => (
                <Dropdown.Item onClick={() => props.filter(severity)}>
                    {severity}
                </Dropdown.Item>
            )
        )}
    </DropdownButton>