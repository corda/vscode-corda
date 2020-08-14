import * as React from "react";
import { InfiniteLoader, List, IndexRange, Index, ListRowProps } from "react-virtualized";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const EntriesLoader = (props: {maxEntries: number}) => {
    const entries = new Array<number>();

    const isRowLoaded = ({index}: Index) => entries[index] !== undefined;

    const loadMoreRows = async ({startIndex, stopIndex}: IndexRange) => {
        for (let i = startIndex; i <= stopIndex; i++) {
            if (!isRowLoaded({index: i})) {
                await sleep(1);
                entries[i] = i;
            }
        }
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
            rowCount = {props.maxEntries}
        >
            {({ onRowsRendered, registerChild }) => (
                <List
                    height={200}
                    onRowsRendered={onRowsRendered}
                    ref={registerChild}
                    rowCount={props.maxEntries}
                    rowHeight={20}
                    rowRenderer={rowRenderer}
                    width={300}
                />
            )}
        </InfiniteLoader>
    )
}
