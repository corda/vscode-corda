import * as vscode from 'vscode';
import { ClassSig } from './typeParsing';

export class CordaFlowsProvider implements vscode.TreeDataProvider<CordaFlow> {
	
	constructor(private flowFiles: ClassSig[]) {}

	private _onDidChangeTreeData: vscode.EventEmitter<CordaFlow | undefined | void> = new vscode.EventEmitter<CordaFlow | undefined | void>();
	readonly onDidChangeTreeData?: vscode.Event<CordaFlow | undefined | void>;
	
	getTreeItem(element: CordaFlow): vscode.TreeItem {
		return element;
	}
	getChildren(element?: CordaFlow): Thenable<CordaFlow[]> {
		if (!element) {
			let flows: CordaFlow[] = this.flowFiles.map(sig => {
				return new CordaFlow(sig.name, vscode.TreeItemCollapsibleState.None);
			});
			return Promise.resolve(flows);
		} else {
			return Promise.resolve([]);
		}	}
	
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