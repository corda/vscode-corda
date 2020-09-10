import React from "react";
import { LogEntry } from "./types";

import {EntriesLoader, entriesLoaderProps} from "./entriesLoader";

export const EntriesDisplay = (props: {filepath: string, amountOfEntries: number}) => {
    type filterType = {
        filterBy: (entry: LogEntry) => boolean
    }

    const [filter, setFilter] = React.useState({filterBy: (entry: LogEntry) => true} as filterType);

    const onUpdateSearch = (text: string) => 
        setFilter({filterBy: (entry: LogEntry) => JSON.stringify(entry).includes(text)});
    
    return (
        <>
            <br/>
            <EntriesLoader 
                filepath={props.filepath}
                amountOfEntries={props.amountOfEntries}
                filterBy={filter.filterBy}
            />
        </>
    )
}