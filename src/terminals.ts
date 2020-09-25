import * as vscode from 'vscode';
 
/**
 * findTerminal returns the instance of the terminal identified by the argument
 * @param termName - terminal to find
 */
export function findTerminal(termName : string) {
	const terminals = <vscode.Terminal[]>(<any>vscode.window).terminals;
	const terminal : any = terminals.filter(t => {
		return t.name == termName;
	});
	return terminal.length > 0 ? terminal[0] : undefined;
}