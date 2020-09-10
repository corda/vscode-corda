import * as React from "react";
import * as ReactDOM from "react-dom";
import InfiniteLoader from "react-window-infinite-loader";
import { VariableSizeList as List } from "react-window";
import { LogEntry, sampleLogEntry } from "../backend/types";
import * as util from "../backend/util";
import axios from "axios";
import { EntryButton, LoadingEntry } from "./entry";

type filterType = (entry: LogEntry) => boolean;

export const EntriesLoader = (props: {filepath: string, amountOfEntries: number, filterBy: filterType}) => {
    let entries = new Array<LogEntry>();

    const isItemLoaded = (index: number) => entries[index] !== undefined;

    // [startIndex, stopIndex)
    const loadMoreItems = async (startIndex: number, stopIndex: number) => {
        const newEntries = (await axios.post("http://localhost:8580/logReader/read", {
            startIndex,
            stopIndex,
            components: props.filepath.replace(/\\/g, "/").split("/")
        }))
        .data.entries
        .map(tidyEntry)

        entries = util.placeAt(entries, newEntries, startIndex);
    }

    const Row = ({index, style}) =>
        isItemLoaded(index) ? 
            <EntryButton entry={entries[index]} key={index}/> :
            <LoadingEntry key={index}/>

    return (
        <InfiniteLoader
            isItemLoaded = {isItemLoaded}
            loadMoreItems = {loadMoreItems}
            itemCount = {props.amountOfEntries}
        >
            {({ onItemsRendered, ref }) => (
                <List
                    onItemsRendered={onItemsRendered}
                    ref={ref}
                    height={600}
                    itemCount={props.amountOfEntries}
                    itemSize={(index: number) => index % 2 === 0 ? 50 : 100}
                    width={300}
                >
                    {Row}
                </List>
            )}
        </InfiniteLoader>
    )
}