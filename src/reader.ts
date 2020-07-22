import * as fs from "fs";
import * as util from "./util";
import * as formats from "./formats";

/**
 * Marks if a log is INFO, WARN or ERROR
 */
export enum LogSeverity {
    INFO,
    WARN,
    ERROR
}

/**
 * A human-readable `message` and an `object` of relevant code details (e.g output) that the log stores 
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

const logSeverityFromString = (string: string) => {
    switch (string) {
        case "WARN":    return LogSeverity.WARN;
        case "ERROR":   return LogSeverity.ERROR;
        default:        return LogSeverity.INFO;
    }
}

const stringToLogBody = (text: string): LogBody => {
    const attemptAtGettingObject = formats.parseVars("{" + util.afterFirst(text, "{"));
    if (util.isEmptyObject(attemptAtGettingObject)) {
        return {message: text, object: {}}
    }
    else return {message: util.beforeFirst(text, "{"), object: attemptAtGettingObject}
}

/**
 * returns a `LogEntry` with all the properties filled in from `line`
 * 
 * **PROBLEM**: does not take timezones into account
 */
const stringToLogEntry = (line: string): LogEntry => {
    const [severity, date, thread, source, body] = util.extract(line, "[{1}] {2} [{3}] {4}. - {5}");
    return {
        severity: logSeverityFromString(severity.trim()),
        date: new Date(util.beforeFirst(date, ",")), // gets the datetime before the timezone name
        thread,
        source,
        body: stringToLogBody(body)
    }
}

/**
 * **(async)** returns the `LogEntry`s from the file located at `file`, in order of most recent (i.e. from EOF to start of file)
 * 
 * limits the amount of entries by `maxEntries`, if it is provided
 */
export const lastLogEntries = async (file: fs.PathLike, maxEntries: number = Infinity) => {
    const tags = ["[INFO ]", "[WARN ]", "[ERROR]"];
    let entries = new Array<LogEntry>();
    let endBytes = fs.statSync(file).size - 1;
    const bufferSize = Math.min(32 * 1024, endBytes + 1);
    let leftOver = "";

    while (endBytes >= 0 && entries.length <= maxEntries) {
        const fileStream = fs.createReadStream(file, {
            start: Math.max(endBytes - bufferSize + 1, 0),
            end: endBytes,
            highWaterMark: bufferSize
        });

        for await (const chunk of fileStream) {
            const splitted = util.splitByAll(chunk.toString(), tags)
                .filter((splat: string) => splat.trim() !== "");
            const stringEntries = [
                ...splitted.slice(1, splitted.length - 1),
                splitted[splitted.length - 1] + leftOver
            ]
            leftOver = splitted[0];

            entries = [
                ...entries,
                ...stringEntries
                    .map((stringEntry: string, _: number) => stringToLogEntry(stringEntry))
                    .reverse(),
            ]
        }
        endBytes -= bufferSize;
    }
    return [...entries, stringToLogEntry(leftOver)];
}