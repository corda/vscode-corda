import * as vscode from 'vscode';

export class CordaOperationsProvider implements vscode.TreeDataProvider<CordaOperation> {
	
	private _onDidChangeTreeData: vscode.EventEmitter<CordaOperation | undefined | void> = new vscode.EventEmitter<CordaOperation | undefined | void>();
	readonly onDidChangeTreeData?: vscode.Event<CordaOperation | undefined | void>;
	
	getTreeItem(element: CordaOperation): vscode.TreeItem {
		return element;
	}
	getChildren(element?: CordaOperation): Thenable<CordaOperation[]> {
		return Promise.resolve([
			new CordaOperation("Assemble", vscode.TreeItemCollapsibleState.None, {
				command: 'corda.assembleCommand',
				title: '',
				arguments: ["Doing Assemble"]
			}),
			new CordaOperation("Build", vscode.TreeItemCollapsibleState.None, {
				command: 'corda.buildCommand',
				title: '',
				arguments: ["Doing Build"]
			}),
			new CordaOperation("Test", vscode.TreeItemCollapsibleState.None, {
				command: 'corda.testCommand',
				title: '',
				arguments: ["Doing Test"]
			}),
			new CordaOperation("Clean", vscode.TreeItemCollapsibleState.None, {
				command: 'corda.cleanCommand',
				title: '',
				arguments: ["Doing Clean"]
			})
		]);
	}
	
	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class CordaOperation extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	iconPath = new vscode.ThemeIcon('run');

}