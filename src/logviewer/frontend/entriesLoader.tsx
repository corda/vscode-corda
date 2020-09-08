import * as React from "react";
import * as ReactDOM from "react-dom";
import { InfiniteLoader, List, IndexRange, Index, ListRowProps, AutoSizer } from "react-virtualized";
import { LogEntry, sampleLogEntry } from "../backend/types";
import * as util from "../backend/util";
import axios from "axios";
import { EntryButton, LoadingEntry } from "./entry";
import { debug } from "console";

export const EntriesLoader = (props: {filepath: string, amountOfEntries: number}) => {
    let entries = new Array<LogEntry>();


    const isRowLoaded = ({index}: Index) => entries[index] !== undefined;

    const tidyEntry = (entry: any) => ({
        ...entry, 
        date: new Date(util.before(entry.date, ",")),
        body: {
            ...entry.body,
            object: JSON.parse(entry.body.object)
        }
    })

    // [startIndex, stopIndex)
    const loadMoreRows = async ({startIndex, stopIndex}: IndexRange) => {
        const newEntries = (await axios.post("http://localhost:8580/logReader/read", {
            startIndex,
            stopIndex,
            components: props.filepath.replace(/\\/g, "/").split("/")
        }))
        .data.entries
        .map(tidyEntry)

        entries = util.placeAt(entries, newEntries, startIndex);
    }

    const rowRenderer = ({key, index, style}: ListRowProps) =>
        isRowLoaded({index}) ? 
        <EntryButton key={key} entry={entries[index]}/> : 
        <LoadingEntry key={key} />

    return (
        <InfiniteLoader
            isRowLoaded = {isRowLoaded}
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