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
 * returns a list of subsequent `entries` that have their `source` field contained in `sources`
 */
export const cluster = (entries: LogEntry[], sources: string[]): LogEntry[][] => util.groupBy<LogEntry>(
    entries, 
    (entry: LogEntry) => sources.includes(entry.source)
)