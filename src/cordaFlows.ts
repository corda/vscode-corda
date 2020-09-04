import * as vscode from 'vscode';

export class CordaFlowsProvider implements vscode.TreeDataProvider<CordaFlow> {
	
	private _onDidChangeTreeData: vscode.EventEmitter<CordaFlow | undefined | void> = new vscode.EventEmitter<CordaFlow | undefined | void>();
	readonly onDidChangeTreeData?: vscode.Event<CordaFlow | undefined | void>;
	
	getTreeItem(element: CordaFlow): vscode.TreeItem {
		return element;
	}
	getChildren(element?: CordaFlow): Thenable<CordaFlow[]> {
		return Promise.resolve([new CordaFlow("Flows here - placeholder", vscode.TreeItemCollapsibleState.None)]);
	}
	
	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class CordaFlow extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	iconPath = new vscode.ThemeIcon('zap');

}