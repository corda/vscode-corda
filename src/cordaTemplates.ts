import * as vscode from 'vscode';

export class CordaTemplatesProvider implements vscode.TreeDataProvider<CordaTemplate> {
	
	private _onDidChangeTreeData: vscode.EventEmitter<CordaTemplate | undefined | void> = new vscode.EventEmitter<CordaTemplate | undefined | void>();
	readonly onDidChangeTreeData?: vscode.Event<CordaTemplate | undefined | void>;
	
	getTreeItem(element: CordaTemplate): vscode.TreeItem {
		return element;
	}
	getChildren(element?: CordaTemplate): Thenable<CordaTemplate[]> {
		return Promise.resolve([new CordaTemplate("Templates here - placeholder", vscode.TreeItemCollapsibleState.None)]);
	}
	
	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class CordaTemplate extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	iconPath = new vscode.ThemeIcon('library');

}