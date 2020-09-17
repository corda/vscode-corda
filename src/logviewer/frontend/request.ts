import * as vscode from 'vscode';
import { LogEntry, LogSeverities } from "./types";
import * as util from "./util";
import axios from "axios";

const resultFromServer = async (domain: string, postRequest: any) => 
    await axios.post(`http://localhost:8580/logReader/${domain}`, postRequest)

const tidyEntry = (entry: any) => ({
    ...entry, 
    severity: LogSeverities[entry.severity],
    date: new Date(util.before(entry.date, ",")),
    body: {
        ...entry.body,
        object: JSON.parse(entry.body.object)
    }
} as LogEntry)


const directoriesIn = (filepath: string) => filepath.replace(/\\/g, "/").split("/");

/** `[startIndex, stopIndex)` */
export const entriesBetween = async (startIndex: number, stopIndex: number, filepath: string) => 
    (await resultFromServer("read", {
        startIndex,
        stopIndex,
        components: directoriesIn(filepath)
    }))
    .data.entries
    .map(tidyEntry) as LogEntry[]


export const countEntries = async (filepath: string) => 
    (await resultFromServer("entriesCount", {
        components: directoriesIn(filepath)
    }))
    .data.entriesCount as number