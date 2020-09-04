/**
 * Marks if a log is `INFO`, `WARN` or `ERROR`
 */
export enum LogSeverity {
    INFO,
    WARN,
    ERROR
}

/**
 * A human-readable `message` and an `object` of relevant code details (e.g code that caused error message) that the log stores 
 */
export interface LogBody {
    message: string,
    object: any
}

/**
 * A complete log entry: `severity`, `date`, `thread`, `source` and `body`
 */
export interface LogEntry {
    severity: LogSeverity,
    date: Date,
    thread: string,
    source: string,
    body: LogBody
}

export const sampleLogEntry = (i: number) => <LogEntry>({
    severity: LogSeverity.INFO,
    date: new Date(),
    thread: "main",
    source: `sample #${i}`,
    body: {
        message: `hello from sample #${i}`,
        object: {sampleNumber: i}
    }
})


export enum MessageType {
    NEW_LOG_ENTRIES
}

export interface WindowMessage {
    messageType: MessageType,
    filepath: string,
    amount: number
}