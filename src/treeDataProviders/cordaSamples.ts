import * as vscode from 'vscode';

export class CordaSamplesProvider implements vscode.TreeDataProvider<CordaSample> {
	
	private _onDidChangeTreeData: vscode.EventEmitter<CordaSample | undefined | void> = new vscode.EventEmitter<CordaSample | undefined | void>();
	readonly onDidChangeTreeData?: vscode.Event<CordaSample | undefined | void>;
	
	getTreeItem(element: CordaSample): vscode.TreeItem {
		return element;
	}
	getChildren(element?: CordaSample): Thenable<CordaSample[]> {
		return Promise.resolve([new CordaSample("Samples here - placeholder", vscode.TreeItemCollapsibleState.None)]);
	}
	
	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class CordaSample extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	iconPath = new vscode.ThemeIcon('github');

}