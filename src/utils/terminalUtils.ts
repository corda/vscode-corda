import * as vscode from 'vscode';
import { DefinedCordaNodeTreeItem } from '../treeDataProviders/cordaLocalNetwork';
import { DefinedCordaNode, RunningNode } from '../types/types';
 
/**
 * takes in a node and returns true if there is a terminal instance for the node active
 * @param n 
 * @param dispose 
 */
export const terminalIsOpenForNode = (n: RunningNode | DefinedCordaNodeTreeItem | DefinedCordaNode, dispose: boolean = false) => {
	const openTerminals: readonly vscode.Terminal[] = vscode.window.terminals;

	const isRunningNode = (object: any): object is RunningNode => {
		return 'definedNode' in object;
	}
	const isDefinedNode = (object: any): object is DefinedCordaNode => {
		return 'x500' in object;
	}

	const nodeNameCheckPred = (t, n) => { // predicate to check composed name
		if (isRunningNode(n)) {
			return t.name == (n.definedNode.x500.name + " : " + n.definedNode.rpcPort);
		} else if (isDefinedNode(n)) { 
			return t.name == (n.x500.name + " : " + n.rpcPort);
		} else {
			return t.name == (n as DefinedCordaNodeTreeItem).nodeDetails.x500.name + " : " + (n as DefinedCordaNodeTreeItem).nodeDetails.rpcPort;
		}
	}

	let hit = openTerminals.find((t) => nodeNameCheckPred(t, n));
	
	if (hit && dispose) { // dispose if requested
		hit?.dispose();	
	} 
	
	return (hit != undefined);
}

/**
 * Returns a terminal instance by name
 * @param termName 
 */
export const findTerminal = (termName: string) => {
	const openTerminals: readonly vscode.Terminal[] = vscode.window.terminals;
	return openTerminals.find((t) => {
		return t.name == termName
	})
}