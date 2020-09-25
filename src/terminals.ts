import * as vscode from 'vscode'
import { SERVER_JAR } from './CONSTANTS';
 
export function launchClient() {
    let debug = true;

	// Launch client
	const name = 'Node Client Server'
	let terminal : vscode.Terminal = findTerminal(name);
	if (!terminal) { // check if client already launched
		const jarPath = vscode.extensions.getExtension("R3.vscode-corda")?.extensionPath;
		const cmd1 = 'cd ' + jarPath;
		const cmd2 = 'java -jar ' + SERVER_JAR; // --servertoken=' + clientToken;
		terminal = vscode.window.createTerminal(name);
		terminal.sendText(cmd1);
		terminal.sendText(cmd2);
		debug ? console.log("Client Launch Successful"):"";
	} else {
		debug ? console.log("Client Already Up"):"";
	}
}

/**
 * findTerminal returns the instance of the terminal identified by the argument
 * @param termName - terminal to find
 */
function findTerminal(termName : string) {
	const terminals = <vscode.Terminal[]>(<any>vscode.window).terminals;
	const terminal : any = terminals.filter(t => {
		return t.name == termName;
	});
	return terminal.length > 0 ? terminal[0] : undefined;
}