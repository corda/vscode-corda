import * as vscode from 'vscode';
import * as path from 'path';

export class CordaDepProvider implements vscode.TreeDataProvider<CordaDependency> {
	
	private _onDidChangeTreeData: vscode.EventEmitter<CordaDependency | undefined | void> = new vscode.EventEmitter<CordaDependency | undefined | void>();
	readonly onDidChangeTreeData?: vscode.Event<CordaDependency | undefined | void>;
	
	getTreeItem(element: CordaDependency): vscode.TreeItem {
		return element;
	}
	getChildren(element?: CordaDependency): Thenable<CordaDependency[]> {
		return Promise.resolve([new CordaDependency("Dependencies here - placeholder", vscode.TreeItemCollapsibleState.None)]);
	}
	
	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class CordaDependency extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};

}