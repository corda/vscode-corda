import React from "react";
import { LogEntry } from "./types";
import { EntriesLoader } from "./entriesLoader";
import { SearchBox } from "./searchBox";
import { Severity } from "./types";
import { DropdownFilter } from "./dropdownFilter";


export const EntriesDisplay = (props: {filepath: string, entriesCount: number}) => {
    type filterType = {
        filterBy: (entry: LogEntry) => boolean
    }

    const [filter, setFilter] = React.useState({filterBy: (entry: LogEntry) => true} as filterType);

    const onSearch = (text: string) => {
        setFilter({filterBy: 
            entry => JSON.stringify(entry).toLowerCase().includes(text.toLowerCase())
        });
    }

    const onDropdownClick = (severity: Severity) =>
        setFilter({filterBy: 
            entry => entry.severity === severity
        })
    
    return (
        <>
            <DropdownFilter filter={onDropdownClick}/>
            <SearchBox
                placeholder="Search here..."
                onUpdateText={onSearch}
            />
            <br/>
            <EntriesLoader 
                filepath={props.filepath}
                entriesCount={props.entriesCount}
                filterBy={filter.filterBy}
            />
        </>
    )
}