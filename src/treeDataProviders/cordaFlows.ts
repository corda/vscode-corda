import * as vscode from 'vscode';
import { ClassSig } from '../typeParsing';

/**
 * Flows provider for generating TreeViews
 */
export class CordaFlowsProvider implements vscode.TreeDataProvider<CordaFlow> {
	
	constructor(private flowFiles: ClassSig[]) {}

	private _onDidChangeTreeData: vscode.EventEmitter<CordaFlow | undefined | void> = new vscode.EventEmitter<CordaFlow | undefined | void>();
	readonly onDidChangeTreeData?: vscode.Event<CordaFlow | undefined | void> = this._onDidChangeTreeData.event;
	
	getTreeItem(element: CordaFlow): vscode.TreeItem {
		return element;
	}
	getChildren(element?: CordaFlow): Thenable<CordaFlow[]> {
		if (!element) {
			let flows: CordaFlow[] = this.flowFiles.map(sig => {
				return new CordaFlow(
					sig.name, 
					vscode.TreeItemCollapsibleState.None, 
					sig,
					{
						command: 'corda.openFile',
						title: '',
						arguments: [sig.file]
					});
			});
			return Promise.resolve(flows);
		} else {
			return Promise.resolve([]);
		}	}
	
	/**
	 * - refreshes the tree view
	 * @param classSig global classSig listing Flows in project
	 */
	refresh(classSig: ClassSig): void {
		(classSig) ? this.flowFiles.push(classSig) : '';
		this._onDidChangeTreeData.fire();
	}
}

export class CordaFlow extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		private readonly classSig: ClassSig,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	iconPath = new vscode.ThemeIcon('zap');
	description = (this.classSig.superClass != undefined) ? this.classSig.superClass : this.classSig.superInterfaces[0]; 

}