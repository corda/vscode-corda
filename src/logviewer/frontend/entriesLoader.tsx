import * as React from "react";
import { InfiniteLoader, List, IndexRange, ListRowProps, AutoSizer } from "react-virtualized";
import { LogEntry, sampleLogEntry } from "./types";
import * as util from "./util";
import * as request from "./request";
import { Entry, LoadingEntry } from "./entry";

export interface entriesLoaderProps {
    filepath: string, 
    entriesCount: number, 
    filterBy: (entry: LogEntry) => boolean
}

export const EntriesLoader = (props: entriesLoaderProps) => {
    const [entries, setEntries] = React.useState(new Array<LogEntry>());

    const isRowLoaded = (index: number) => !!entries[index];

    
    /** `[startIndex, stopIndex)` */
    const loadMoreRows = async ({startIndex, stopIndex}: IndexRange) => {
        console.log("loading from", startIndex, "to", stopIndex);
        setEntries(util.placeAt(
            entries, 
            await request.entriesBetween(startIndex, stopIndex, props.filepath), 
            startIndex
        ));
    }

    const rowRenderer = ({key, index, style}: ListRowProps) => {
        if (isRowLoaded(index)) {
            if (props.filterBy(entries[index])) {
                console.log(entries[index], "passes filter");
                return <Entry entry={entries[index]} key={key} />
            }
            else {
                console.log(entries[index], "fails to pass filter");
                return <div style={{display: "none"}}> I'm invisible! </div>;
            }
        }
        else {
            console.log(entries);
            return <LoadingEntry key={key}/>
        }
    }
        

    return (
        <InfiniteLoader
            isRowLoaded = {({index}) => isRowLoaded(index)}
            loadMoreRows = {loadMoreRows}
            rowCount = {props.entriesCount}
        >
            {({ onRowsRendered, registerChild }) =>
                <AutoSizer>
                    {({width, height}) => 
                        <List
                            height={height}
                            width={width}
                            onRowsRendered={onRowsRendered}
                            ref={registerChild}
                            rowCount={props.entriesCount}
                            rowRenderer={rowRenderer}
                            rowHeight={30}
                        />
                    }
                </AutoSizer>
            }
        </InfiniteLoader>
    )
}