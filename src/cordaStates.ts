import * as vscode from 'vscode';

export class CordaStatesProvider implements vscode.TreeDataProvider<CordaState> {
	
	private _onDidChangeTreeData: vscode.EventEmitter<CordaState | undefined | void> = new vscode.EventEmitter<CordaState | undefined | void>();
	readonly onDidChangeTreeData?: vscode.Event<CordaState | undefined | void>;
	
	getTreeItem(element: CordaState): vscode.TreeItem {
		return element;
	}
	getChildren(element?: CordaState): Thenable<CordaState[]> {
		return Promise.resolve([new CordaState("States here - placeholder", vscode.TreeItemCollapsibleState.None)]);
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