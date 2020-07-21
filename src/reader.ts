import * as fs from "fs";
import * as util from "./util";
import { file } from "find";
export enum LogStatus {
    INFO,
    WARN,
    ERROR
}

export interface LogEntry {
    logStatus: LogStatus,
    date: Date,
    thread: string,
    source: string,
    message: string
}

/**
 * returns the `LogStatus` status of the `string` passed. 
 * 
 * Defaults to `LogStatus.INFO`  
 */
const stringToStatus = (string: string) => {
    switch (string) {
        case "WARN":    return LogStatus.WARN;
        case "ERROR":   return LogStatus.ERROR;
        default:        return LogStatus.INFO;
    }
}

/**
 * takes a log entry as string, `line`
 * 
 * returns a `LogEntry` with all the properties filled in from `line`
 */
const stringToLogEntry = (line: string): LogEntry => {
    const elements = util.elements(line, "[{1}] {2} [{3}] {4}. - {5}");
    const [status, date, thread, source, message] = elements;
    return {
        logStatus: stringToStatus(status.trim()),
        date: new Date(date),
        thread,
        source,
        message
    }
}


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
        console.log(endBytes);
        for await (const chunk of fileStream) {
            const splitted = util.splitOnAny(chunk.toString(), tags)
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
        endBytes = endBytes - bufferSize;
    }
    return [...entries, stringToLogEntry(leftOver)];
}