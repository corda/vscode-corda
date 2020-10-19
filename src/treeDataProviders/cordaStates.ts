import * as vscode from 'vscode';
import { ClassSig } from '../types/typeParsing';
import { Commands, WorkStateKeys } from '../types/CONSTANTS';

/**
 * States provider for generating TreeViews
 */
export class CordaStatesProvider implements vscode.TreeDataProvider<CordaState> {
	
	private contractStateFiles: ClassSig[];
	private context: vscode.ExtensionContext;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
		const projectObjects:{projectClasses: any, projectInterfaces:any} | undefined = context.workspaceState.get(WorkStateKeys.PROJECT_OBJECTS);
		this.contractStateFiles = projectObjects?.projectClasses.contractStateClasses as ClassSig[];
	}

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
	 */
	refresh(): void {
		const projectObjects:{projectClasses: any, projectInterfaces:any} | undefined = this.context.workspaceState.get(WorkStateKeys.PROJECT_OBJECTS);
		this.contractStateFiles = projectObjects?.projectClasses.contractStateClasses as ClassSig[];
		this._onDidChangeTreeData.fire();
	}
}

export class CordaState extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly classSig: ClassSig,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	iconPath = new vscode.ThemeIcon('database');
	description = (this.classSig.superClass != undefined) ? this.classSig.superClass : this.classSig.superInterfaces[0]; 
	contextValue = (this.classSig.boundTo != undefined) ? 'classIsBound' : 'classNotBound';
}