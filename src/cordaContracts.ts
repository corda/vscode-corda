import * as vscode from 'vscode';
import { ClassSig } from './typeParsing';

export class CordaContractsProvider implements vscode.TreeDataProvider<CordaContract> {
	
	constructor(private contractFiles: ClassSig[]) {}

	private _onDidChangeTreeData: vscode.EventEmitter<CordaContract | undefined | void> = new vscode.EventEmitter<CordaContract | undefined | void>();
	readonly onDidChangeTreeData?: vscode.Event<CordaContract | undefined | void>;
	
	getTreeItem(element: CordaContract): vscode.TreeItem {
		return element;
	}
	getChildren(element?: CordaContract): Thenable<CordaContract[]> {
		if (!element) {
			let contracts: CordaContract[] = this.contractFiles.map(sig => {
				return new CordaContract(
					sig.name, 
					vscode.TreeItemCollapsibleState.None, 
					sig,
					{
						command: 'corda.openFile',
						title: '',
						arguments: [sig.file]
					});
			});
			return Promise.resolve(contracts);
		} else {
			return Promise.resolve([]);
		}	}
	
	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class CordaContract extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		private readonly classSig: ClassSig,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	iconPath = new vscode.ThemeIcon('law');

}