import * as React from "react";
import { InfiniteLoader, List, IndexRange, Index, ListRowProps } from "react-virtualized";
import { LogEntry, sampleLogEntry } from "../backend/types";
import * as util from "../backend/util";
import axios from "axios";
import { EntryButton, LoadingEntry } from "./entry";
import "./Table.css"

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
            <EntryButton entry={entries[index]} key={key} /> :
            <LoadingEntry key={key} />
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
                    height={1000}
                    onRowsRendered={onRowsRendered}
                    ref={registerChild}
                    rowCount={props.amountOfEntries}
                    rowHeight={120}
                    rowRenderer={rowRenderer}
                    width={2000}
                />
            )}
        </InfiniteLoader>
    )
}