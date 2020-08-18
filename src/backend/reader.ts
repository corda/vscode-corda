import * as fsReact from "react-native-fs";
import * as util from "./util";
import * as formats from "./formats";
import * as parser from "./stringParser";
import { LogSeverity, LogBody, LogEntry, sampleLogEntry } from "./types";

/** 1MB */
const bufferSize = 10e6; 

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
    const format = "[{0}] {1} [{2}] {3} - {4}";
    if (parser.matchesFormat(line, format)) {
        const [severity, date, thread, source, body] = parser.extract(line, format);
        return {
            severity: logSeverityFromString(severity.trim()),
            date: new Date(util.before(date, ",")), // gets the datetime before the timezone name
            thread,
            source,
            body: stringToLogBody(body) // x = "hi", y = 15, 
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


/** the amount of log entries in `file` */
export const countEntriesInFile = async (file: string) => {
    const tags = ["[INFO ]", "[WARN ]", "[ERROR]"];
    let linesSeen = 0;
    let leftOver = "";

    for (let startBytes = 0; startBytes <= (await sizeInBytes(file)); startBytes += bufferSize) {
        const buffer = fsReact.read(file, bufferSize, startBytes);
        const splitted = util.splitByAll(leftOver + buffer, tags).filter(l => l.trim() !== "");
        linesSeen += splitted.length - 1;
        leftOver = splitted[splitted.length - 1];
    }
    return linesSeen + 1;
}


/**
 * returns the entries in the logfile sorted by newest, between `startIdx` (inc.) and `stopIdx` (exc.)
 */
export const entriesBetweenLines = async (filepath: string, startIdx: number, stopIdx: number, totalEntries?: number) => {    
    if (totalEntries === undefined) {
        totalEntries = await countEntriesInFile(filepath);
    }
    
    const startReadingAt = util.bound(0, totalEntries - stopIdx, totalEntries); // factors in how [startIdx, stopIdx)
    const amount = util.bound(0, stopIdx - startIdx, totalEntries - startReadingAt);
    
    return (await excerptOfEntries(filepath, startReadingAt, amount)).reverse();
}


export const excerptOfEntries = async (filepath: string, startReadingAt: number, amount: number) => {
    const tags = ["[INFO ]", "[WARN ]", "[ERROR]"];
    let linesSeen = 0;
    let entries = new Array<LogEntry>();
    let leftOver = "";
    let haventAddedEntriesYet = true;
    let readingUpToEOF = false;

    for (let startBytes = 0; startBytes <= (await sizeInBytes(filepath)); startBytes += bufferSize) {
        const buffer = await fsReact.read(filepath, bufferSize, startBytes);
        const splitted = util.splitByAll(leftOver + buffer, tags)
            .filter(line => line.trim() !== "")
        
        if (linesSeen + splitted.length >= startReadingAt) {
            const start = haventAddedEntriesYet ? startReadingAt - linesSeen : 0;
            let end = start + amount - entries.length - 1;
            
            readingUpToEOF = end === splitted.length - 1; // this will be accurate outside of for loop
            if (readingUpToEOF) {
                end -= 1;
            }

            const newEntries = splitted.slice(start, end + 1).map(stringToLogEntry); 

            entries = [...entries, ...newEntries];

            linesSeen += splitted.length;
            leftOver = splitted[splitted.length - 1];
            if (haventAddedEntriesYet) haventAddedEntriesYet = false;
        }

        if (entries.length === amount) 
            break;
    }

    if (readingUpToEOF) {
        entries = [...entries, stringToLogEntry(leftOver)];
    }
    return entries;
}

const sizeInBytes = async (file: string) => parseInt((await fsReact.stat(file)).size)