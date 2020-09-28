import * as vscode from 'vscode';
import { RunningNode } from './types';
 


export const terminalIsOpenForNode = (n: RunningNode, dispose: boolean = false) => {
	const openTerminals: readonly vscode.Terminal[] = vscode.window.terminals;
	const nodeNameCheckPred = (t, n) => { // predicate to check composed name
		return t.name == (n.deployedNode.x500.name + " : " + n.deployedNode.rpcPort)
	}

	let hit = openTerminals.find((t) => nodeNameCheckPred(t, n));
	
	if (hit && dispose) { // dispose if requested
		hit?.dispose();	
	} 
	
	return (hit != undefined);
}

export const findTerminal = (termName: string) => {
	const openTerminals: readonly vscode.Terminal[] = vscode.window.terminals;
	return openTerminals.find((t) => {
		return t.name == termName
	})
}