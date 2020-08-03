import * as fs from "fs";
import * as util from "./util";
import * as formats from "./backend/formats";
import * as parser from "./stringParser";
import { LogSeverity, LogBody, LogEntry } from "./types";

const logSeverityFromString = (string: string) => {
    switch (string) {
        case "WARN":    return LogSeverity.WARN;
        case "ERROR":   return LogSeverity.ERROR;
        default:        return LogSeverity.INFO;
    }
}

const stringToLogBody = (text: string): LogBody => {
    const attemptAtGettingObject = formats.parseVars("{" + util.after(text, "{"));
    if (util.isEmptyObject(attemptAtGettingObject)) {
        return {message: text, object: {}}
    }
    else return {message: util.before(text, "{"), object: attemptAtGettingObject}
}

/**
 * returns a `LogEntry` with all the properties filled in from `line`
 * 
 * **PROBLEM**: does not take timezones into account
 */
const stringToLogEntry = (line: string): LogEntry => {
    const format = "[{0}] {1} [{2}] {3}. - {4}";
    if (parser.matchesFormat(line, format)) {
        const [severity, date, thread, source, body] = parser.extract(line, format);
        return {
            severity: logSeverityFromString(severity.trim()),
            date: new Date(util.before(date, ",")), // gets the datetime before the timezone name
            thread,
            source,
            body: stringToLogBody(body)
        }
    }
    
    else throw new Error(`Could not parse line 
        ${line} 
        according to format 
        ${format}`
    );
}

/**
 * **(async)** returns the `LogEntry`s from the file located at `file`, in order of most recent (i.e. from EOF to start of file)
 * 
 * limits the amount of entries by `maxEntries`, if it is provided
 */
export const lastLogEntries = async (file: fs.PathLike, maxEntries: number = Infinity) => 
    lastLogEntriesBetweenBytes(file, 0, fs.statSync(file).size - 1, maxEntries);

// generalised version of lastLogEntries
const lastLogEntriesBetweenBytes = async (file: fs.PathLike, startAt: number, endAt: number, maxEntries: number = Infinity) => {
    const tags = ["[INFO ]", "[WARN ]", "[ERROR]"];
    let entries = new Array<LogEntry>();
    let end = endAt; //fs.statSync(file).size - 1;
    const bufferSize = Math.min(32 * 1024, endAt + 1);
    let leftOver = "";

    while (end >= 0 && entries.length <= maxEntries) {
        const fileStream = fs.createReadStream(file, {
            start: Math.max(end - bufferSize + 1, startAt),
            end: end,
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
                    .map((stringEntry: string) => stringToLogEntry(stringEntry))
                    .reverse(),
            ]
        }
        end -= bufferSize;
    }
    return [...entries, stringToLogEntry(leftOver)];
}


export const handleNewEntries = (file: fs.PathLike, onNewEntries: (entries: LogEntry[]) => void) => 
    fs.watchFile(
        file, 
        async (curr: fs.Stats, prev: fs.Stats) => 
            onNewEntries(await lastLogEntriesBetweenBytes(file, prev.size, curr.size))
    )