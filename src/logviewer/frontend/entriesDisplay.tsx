import React from "react";
import { LogEntry } from "./types";
import { EntriesLoader } from "./entriesLoader";
import { SearchBox } from "./searchBox";

export const EntriesDisplay = (props: {filepath: string, entriesCount: number}) => {
    type filterType = {
        filterBy: (entry: LogEntry) => boolean
    }

    const [filter, setFilter] = React.useState({filterBy: (entry: LogEntry) => true} as filterType);

    const onUpdateText = (text: string) => {
        setFilter({filterBy: 
            (entry: LogEntry) => JSON.stringify(entry).toLowerCase().includes(text.toLowerCase())
        });
    }
    
    return (
        <>
            <SearchBox
                placeholder="Search here..."
                onUpdateText={onUpdateText}
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