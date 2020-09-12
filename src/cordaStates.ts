import * as vscode from 'vscode';
import { ClassSig } from './typeParsing';

export class CordaStatesProvider implements vscode.TreeDataProvider<CordaState> {
	
	constructor(private  contractStates: ClassSig[]) {}

	private _onDidChangeTreeData: vscode.EventEmitter<CordaState | undefined | void> = new vscode.EventEmitter<CordaState | undefined | void>();
	readonly onDidChangeTreeData?: vscode.Event<CordaState | undefined | void>;
	
	getTreeItem(element: CordaState): vscode.TreeItem {
		return element;
	}
	getChildren(element?: CordaState): Thenable<CordaState[]> {
		if (!element) {
			let states: CordaState[] = this.contractStates.map(sig => {
				return new CordaState(sig.name, vscode.TreeItemCollapsibleState.None);
			});
			return Promise.resolve(states);
		} else {
			return Promise.resolve([]);
		}
	}
	
	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class CordaState extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	iconPath = new vscode.ThemeIcon('database');

}