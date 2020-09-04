import * as vscode from 'vscode';

export class CordaContractsProvider implements vscode.TreeDataProvider<CordaContract> {
	
	private _onDidChangeTreeData: vscode.EventEmitter<CordaContract | undefined | void> = new vscode.EventEmitter<CordaContract | undefined | void>();
	readonly onDidChangeTreeData?: vscode.Event<CordaContract | undefined | void>;
	
	getTreeItem(element: CordaContract): vscode.TreeItem {
		return element;
	}
	getChildren(element?: CordaContract): Thenable<CordaContract[]> {
		return Promise.resolve([new CordaContract("Contracts here - placeholder", vscode.TreeItemCollapsibleState.None)]);
	}
	
	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class CordaContract extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	iconPath = new vscode.ThemeIcon('law');

}