import * as React from "react";
import { InfiniteLoader, List, IndexRange, ListRowProps, AutoSizer } from "react-virtualized";
import { LogEntry } from "../backend/types";
import * as util from "../backend/util";
import axios from "axios";
import { EntryButton, LoadingEntry } from "./entry";

type filterType = (entry: LogEntry) => boolean;

export const EntriesLoader = (props: {filepath: string, amountOfEntries: number, filterBy: filterType}) => {
    let entries = new Array<LogEntry>();

    const isRowLoaded = (index: number) => entries[index] !== undefined;

    const tidyEntry = (entry: any) => ({
        ...entry, 
        date: new Date(util.before(entry.date, ",")),
        body: {
            ...entry.body,
            object: JSON.parse(entry.body.object)
        }
    })

    // [startIndex, stopIndex)
    const loadMoreRows = async (startIndex: number, stopIndex: number) => {
        const newEntries = (await axios.post("http://localhost:8580/logReader/read", {
            startIndex,
            stopIndex,
            components: props.filepath.replace(/\\/g, "/").split("/")
        }))
        .data.entries
        .map(tidyEntry)

        entries = util.placeAt(entries, newEntries, startIndex);
    }

    const rowRenderer = ({key, index, style}: ListRowProps) => {
        if (isRowLoaded(index)) {
            if (props.filterBy(entries[index])) {
                return <EntryButton entry={entries[index]} key={key} />
            }
            return <div style={{display: "none"}}> I'm invisible! </div>;
        }
        return <LoadingEntry key={key}/>
    }
        

    return (
        <InfiniteLoader
            isRowLoaded = {({index}) => isRowLoaded(index)}
            loadMoreRows = {loadMoreRows}
            rowCount = {props.amountOfEntries}
        >
            {({ onRowsRendered, registerChild }) =>
                <AutoSizer>
                    {({width, height}) => 
                        <List
                            style={{background: "blue"}}
                            height={height}
                            width={width}
                            onRowsRendered={onRowsRendered}
                            ref={registerChild}
                            rowCount={props.amountOfEntries}
                            rowRenderer={rowRenderer}
                            rowHeight={1 + height / props.amountOfEntries}
                        />
                    }
                </AutoSizer>
            }
        </InfiniteLoader>
    )
}