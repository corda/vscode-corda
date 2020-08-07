import { LogBody, LogEntry, LogSeverity } from "./types"
import * as util from "./util";


/**
 * returns the `entries` with each `body` field replaced with `edit(body)` 
 */
export const editBody = (entries: LogEntry[], edit: (body: LogBody) => LogBody): LogEntry[] =>
    entries.map((entry: LogEntry) => ({
        ...entry,
        body: edit(entry.body)
    }))


/**
 * entries are grouped into 
 * 
 * `[ [entries that have entry.source in sg] for sg in sourceGroups ]`
 */
export const groupEntriesBySource = (entries: LogEntry[], sourceGroups: string[][]) => 
    sourceGroups.map(
        (sources: string[]) => 
            entries.filter((entry: LogEntry) => sources.includes(entry.source))
    )


/**
 * `entries` are grouped into consecutive rows that have their source in the same sourceGroup
 */
export const groupConsecutiveEntriesBy = (entries: LogEntry[], sourceGroups: string[][]): LogEntry[][] => {
    if (!entries.some(e => sourceGroups.some(sg => sg.includes(e.source))))
        return new Array<Array<LogEntry>>();

    const groupStart = util.firstIndexSuchThat(
            entries, 
            e => sourceGroups.some(sg => sg.includes(e.source))
    );
    
    const groupLength = util.firstIndexSuchThat(
        entries.slice(groupStart),
            e => sourceGroups
                    .filter(sg => sg.includes(entries[groupStart].source))
                    .every(sg => !sg.includes(e.source))
    );

    const outsideOfGroup = groupLength === -1 ? entries.length : groupStart + groupLength
            
    return [
        entries.slice(groupStart, outsideOfGroup),
        ...groupConsecutiveEntriesBy(entries.slice(outsideOfGroup), sourceGroups)
    ]
}

