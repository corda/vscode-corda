import * as vscode from 'vscode';
import { ClassSig } from '../types/typeParsing';
import { Commands } from '../types/CONSTANTS';

/**
 * States provider for generating TreeViews
 */
export class CordaStatesProvider implements vscode.TreeDataProvider<CordaState> {
	
	constructor(private contractStateFiles: ClassSig[] = []) {}

	private _onDidChangeTreeData: vscode.EventEmitter<CordaState | undefined | void> = new vscode.EventEmitter<CordaState | undefined | void>();
	readonly onDidChangeTreeData?: vscode.Event<CordaState | undefined | void> = this._onDidChangeTreeData.event;
	
	getTreeItem(element: CordaState): vscode.TreeItem {
		return element;
	}
	getChildren(element?: CordaState): Thenable<CordaState[]> {
		if (!element) {
			let contractStates: CordaState[] = this.contractStateFiles.map(sig => {
				return new CordaState(
					sig.name, 
					vscode.TreeItemCollapsibleState.None, 
					sig,
					{
						command: Commands.CORDA_OPEN_FILE,
						title: '',
						arguments: [sig.file]
					});
			});
			return Promise.resolve(contractStates);
		} else {
			return Promise.resolve([]);
		}
	}
	
	/**
	 * - refreshes the tree view
	 * @param classSig global classSig listing States in project
	 */
	refresh(classSig: ClassSig): void {
		if (classSig instanceof Array) { this.contractStateFiles = classSig }
		else if (classSig instanceof ClassSig) { this.contractStateFiles.push(classSig) } 
		this._onDidChangeTreeData.fire();
	}
}

export class CordaState extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		private readonly classSig: ClassSig,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	iconPath = new vscode.ThemeIcon('database');
	description = (this.classSig.superClass != undefined) ? this.classSig.superClass : this.classSig.superInterfaces[0]; 

}