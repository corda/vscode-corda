import * as filestream from "fs";
import * as util from "./util";
import * as logLines from "./lines";

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
 * returns a promise of a list of all the lines in the file
 * @param filePath the full path of the file
 * @param start (optional) the line number to start at (inclusive) (default is 1)
 * @param end (optional) the line number to end at (inclusive) (default is up to EOF)
 */

export const linesFromFile = async (filePath: filestream.PathLike, start: number = 1, end: number = Infinity) => {
    const fileStream = filestream.createReadStream(filePath);
    const maxLength = end - start;
    let lines = Array<string>();
    let position = 0;

    for await (const chunk of fileStream) {
        const chunkLines: Array<string> = chunk.toString().split("\n")

        if (position + chunkLines.length >= start) {
            const startIdx = lines.length === 0 ? start - 1 - position : 0;
            const endIdx = Math.min(startIdx + maxLength - lines.length, chunkLines.length - 1);

            let toAdd = chunkLines.slice(startIdx, endIdx + 1);
            if (lines.length !== 0) {
                lines = [
                    ...lines.slice(0, lines.length - 1),
                    lines[lines.length - 1] + toAdd[0],
                    ...toAdd.slice(1)
                ];
            }
            else {
                lines = toAdd;
            }
            
            position += endIdx + 1;
        }
        else  position += chunkLines.length - 1;
        
        if (position >= end) break;

    }

    return lines;
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
 * takes a log file `line`, and returns a `LogEntry` with all the properties filled in
 */
export const lineToLogEntry = (line: string): LogEntry => {
    const elements = util.elements(line, "[{1} ] {2} [{3}] {4}. - {5}");
    const [status, date, thread, source, message] = elements;
    return {
        logStatus: stringToStatus(status),
        date: new Date(date),
        thread,
        source,
        message
    }
}

/**
 * returns a promise of a list of all the log entries in the file between the lines numbered `start` and `end`
 * 
 * **PROBLEM**: reads the lines between `start` and `end` first, then converts them to `LogEntry`s.
 * So if a log entry spans multiple lines and ends after `end`, it'll be cut short.
 */
export const logEntriesFromFile = async (filePath: filestream.PathLike, start?: number, end?: number) => {
    const lines = await linesFromFile(filePath, start, end);
    const isStartOfLog = (line: string) => ["[INFO ] ", "[WARN ] ", "[ERROR ] "].some((start: string) => line.startsWith(start));
    const logEntries = Array<LogEntry>();
    let i = 0;

    while (i < lines.length) {
        let line = lines[i];
        if (isStartOfLog(line)) {
            let j = 1;
            while (i + j < lines.length && !isStartOfLog(lines[i + j])) {
                line += "\n" + lines[i + j];
                j++;
            }        
            console.log(line);
            logEntries.push(lineToLogEntry(line));
        }
        i++;
    }

    return logEntries;    
}