import * as vscode from 'vscode';
import { LogEntry } from "./types";
import * as util from "./util";
import axios from "axios";

export const launchServer = () => {
    const termName = "Node Client Server";
    if (findTerminal(termName) === undefined) {
        const terminal = vscode.window.createTerminal(termName);
        const jarPath = vscode.extensions.getExtension("R3.vscode-corda")?.extensionPath;
        terminal.sendText(`cd ${jarPath}`);
        terminal.sendText(`java -jar explorer-server-0.1.0.jar`);
        console.log("Client launched successfully!");
    } 
    else {
        console.log("Client already up");
    }
}

const findTerminal = (termName: string) => {
	const terminals = vscode.window.terminals.filter(t => t.name == termName);
	return terminals.length !== 0 ? terminals[0] : undefined;
}

const resultFromServer = async (domain: string, postRequest: any) => 
    await axios.post(`http://localhost:8580/logReader/${domain}`, postRequest)

const tidyEntry = (entry: any) => ({
    ...entry, 
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