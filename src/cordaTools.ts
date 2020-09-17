import * as vscode from 'vscode';
import * as path from 'path';

export class CordaToolsProvider implements vscode.TreeDataProvider<CordaTool> {
	
	private _onDidChangeTreeData: vscode.EventEmitter<CordaTool | undefined | void> = new vscode.EventEmitter<CordaTool | undefined | void>();
	readonly onDidChangeTreeData?: vscode.Event<CordaTool | undefined | null>;
	
	getTreeItem(element: CordaTool): vscode.TreeItem {
		return element;
	}
	getChildren(element?: CordaTool): Thenable<CordaTool[]> {
		return Promise.resolve([
			new CordaTool("Node Explorer", vscode.TreeItemCollapsibleState.None, {
				command: 'corda.nodeExplorerCommand',
				title: '',
				arguments: ["nodeexplorer"]
			}),
			new CordaTool("Log Viewer", vscode.TreeItemCollapsibleState.None, {
				command: 'corda.logViewerCommand',
				title: '',
				arguments: ["logviewer"]
			})
		]);
	}
	
	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class CordaTool extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	iconPath = (this.label == "Node Explorer")? new vscode.ThemeIcon('rocket') : new vscode.ThemeIcon('telescope');

}