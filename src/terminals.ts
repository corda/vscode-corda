import * as vscode from 'vscode';
import { Node } from './treeDataProviders/cordaLocalNetwork';
import { RunningNode } from './types';
 


export const terminalIsOpenForNode = (n: RunningNode | Node, dispose: boolean = false) => {
	const openTerminals: readonly vscode.Terminal[] = vscode.window.terminals;

	const isRunningNode = (object: any): object is RunningNode => {
		return 'id' in object;
	}

	const nodeNameCheckPred = (t, n) => { // predicate to check composed name
		if (isRunningNode(n)) {
			return t.name == (n.deployedNode.x500.name + " : " + n.deployedNode.rpcPort)
		} else {
			return t.name == (n as Node).nodeDetails.x500.name + " : " + (n as Node).nodeDetails.rpcPort;
		}
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