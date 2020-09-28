import * as vscode from 'vscode';
import { Commands } from '../CONSTANTS';

export class CordaOperationsProvider implements vscode.TreeDataProvider<CordaOperation> {
	
	private _onDidChangeTreeData: vscode.EventEmitter<CordaOperation | undefined | void> = new vscode.EventEmitter<CordaOperation | undefined | void>();
	readonly onDidChangeTreeData?: vscode.Event<CordaOperation | undefined | void>;
	
	getTreeItem(element: CordaOperation): vscode.TreeItem {
		return element;
	}
	getChildren(element?: CordaOperation): Thenable<CordaOperation[]> {
		return Promise.resolve([
			new CordaOperation("Assemble", vscode.TreeItemCollapsibleState.None, 
				{
					command: Commands.OPERATIONS_ASSEMBLE,
					title: '',
					arguments: ["Doing Assemble"]
				},
				"Assemble the outputs"
			),
			new CordaOperation("Build", vscode.TreeItemCollapsibleState.None, 
				{
					command: Commands.OPERATIONS_BUILD,
					title: '',
					arguments: ["Doing Build"]
				},
				"Build outputs and run tests"
			),
			new CordaOperation("Test", vscode.TreeItemCollapsibleState.None, 
				{
					command: Commands.OPERATIONS_TEST,
					title: '',
					arguments: ["Doing Test"]
				},
				"Run all tests in Project"
			),
			new CordaOperation("Clean", vscode.TreeItemCollapsibleState.None, 
				{
					command: Commands.OPERATIONS_CLEAN,
					title: '',
					arguments: ["Doing Clean"]
				},
				"Clean project - remove all outputs"
			)
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
		public readonly command?: vscode.Command,
		public readonly toolTip?: string | undefined,
	) {
		super(label, collapsibleState);
		this.tooltip = toolTip;
	}

	iconPath = new vscode.ThemeIcon('run');

}