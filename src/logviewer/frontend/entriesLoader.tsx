import * as React from "react";
import { InfiniteLoader, List, IndexRange, ListRowProps, AutoSizer } from "react-virtualized";
import { LogEntry, sampleLogEntry } from "./types";
import * as util from "./util";
import * as request from "./request";
import { EntryButton, LoadingEntry } from "./entry";

export interface entriesLoaderProps {
    filepath: string, 
    amountOfEntries: number, 
    filterBy: (entry: LogEntry) => boolean
}

export const EntriesLoader = (props: entriesLoaderProps) => {
    let entries = new Array<LogEntry>();

    const isRowLoaded = (index: number) => !!entries[index];

    
    /** `[startIndex, stopIndex)` */
    const loadMoreRows = async ({startIndex, stopIndex}: IndexRange) => {
        entries = util.placeAt(
            entries, 
            await request.entriesBetween(startIndex, stopIndex, props.filepath), 
            startIndex
        );
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
                            rowHeight={30}
                        />
                    }
                </AutoSizer>
            }
        </InfiniteLoader>
    )
}