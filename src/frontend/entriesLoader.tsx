import * as React from "react";
import { InfiniteLoader, List, IndexRange, Index, ListRowProps } from "react-virtualized";
import { LogEntry, sampleLogEntry } from "../backend/types";
import * as util from "../backend/util";
import axios from "axios";


export const EntriesLoader = (props: {filepath: string, amountOfEntries: number}) => {
    let entries = new Array<LogEntry>();

    const isRowLoaded = ({index}: Index) => entries[index] !== undefined;

    // [startIndex, stopIndex)
    const loadMoreRows = async ({startIndex, stopIndex}: IndexRange) => {
        const newEntries = (await axios.post("http://localhost:8580/logReader/read", {
            startIndex,
            stopIndex,
            components: props.filepath.replace(/\\/g, "/").split("/")
        }))
        .data.entries
        .map((entry: any) => ({
            ...entry, 
            date: new Date(util.before(entry.date, ","))
        }))

        entries = util.placeAt(entries, newEntries, startIndex);
    }

    const rowRenderer = ({key, index, style}: ListRowProps) => {
        const content = isRowLoaded({index}) ? 
            `Entry from ${entries[index].source}` : 
            " . . . . . . . . . .";
        return (
            <div key = {key} style = {style}>
                {content}
            </div>
        )
    }

    return (
        <InfiniteLoader
            isRowLoaded = {isRowLoaded}
            loadMoreRows = {loadMoreRows}
            rowCount = {props.amountOfEntries}
        >
            {({ onRowsRendered, registerChild }) => (
                <List
                    height={200}
                    onRowsRendered={onRowsRendered}
                    ref={registerChild}
                    rowCount={props.amountOfEntries}
                    rowHeight={20}
                    rowRenderer={rowRenderer}
                    width={300}
                />
            )}
        </InfiniteLoader>
    )
}

const filePathToComponents = (filePath: string) => {
    const stdPath = filePath.replace(/\\/g, "/");
    // components have to be relative to %HOME% or ~, but stdPath is absolute
}