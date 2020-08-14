import * as React from "react";
import { InfiniteLoader, List, IndexRange, Index, ListRowProps } from "react-virtualized";
import { LogEntry } from "../backend/types";
import { PathLike } from "fs";
import * as util from "../backend/util"

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const maxEntries = 10e6

export const EntriesLoader = (/*props: {file: PathLike}*/) => {
    let entries = new Array<number>();

    const isRowLoaded = ({index}: Index) => entries[index] !== undefined;

    // [startIndex, stopIndex)
    const loadMoreRows = async ({startIndex, stopIndex}: IndexRange) => {
        await sleep(stopIndex - startIndex);
        const newEntries = [...Array(stopIndex - startIndex).keys()].map(i => startIndex + i)
        entries = util.placeAt(entries, newEntries, startIndex);
    }

    const rowRenderer = ({key, index, style}: ListRowProps) => {
        const content = isRowLoaded({index}) ? 
            `Entry # ${entries[index]}` : 
            " . . . ";
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
            rowCount = {maxEntries}
        >
            {({ onRowsRendered, registerChild }) => (
                <List
                    height={200}
                    onRowsRendered={onRowsRendered}
                    ref={registerChild}
                    rowCount={maxEntries}
                    rowHeight={20}
                    rowRenderer={rowRenderer}
                    width={300}
                />
            )}
        </InfiniteLoader>
    )
}
