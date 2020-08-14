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

export enum MessageType {
    NEW_LOG_ENTRIES
}

export interface WindowMessage {
    messageType: MessageType,
    payload: any
}