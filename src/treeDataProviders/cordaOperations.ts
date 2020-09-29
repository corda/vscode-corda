import * as vscode from 'vscode';
import { Commands } from '../CONSTANTS';

export class CordaOperationsProvider implements vscode.TreeDataProvider<CordaOperation> {
	
	private _onDidChangeTreeData: vscode.EventEmitter<CordaOperation | undefined | void> = new vscode.EventEmitter<CordaOperation | undefined | void>();
	readonly onDidChangeTreeData?: vscode.Event<CordaOperation | undefined | void> = this._onDidChangeTreeData.event;
	
	private operations: {[name:string]: CordaOperation} = {};

	constructor() {
		this.operations['assemble'] = new CordaOperation(
			"Assemble", 
			'assemble',
			vscode.TreeItemCollapsibleState.None,
			// false,
		); 
		this.operations['build'] = new CordaOperation(
			"Build", 
			'build',
			vscode.TreeItemCollapsibleState.None, 
			// false,
		);
		this.operations['test'] = new CordaOperation(
			"Test", 
			'test',
			vscode.TreeItemCollapsibleState.None, 
			// false,
		);
		this.operations['clean'] = new CordaOperation(
			"Clean", 
			'clean',
			vscode.TreeItemCollapsibleState.None, 
			// false,
		);
	}

	getTreeItem(element: CordaOperation): vscode.TreeItem {
		return element;
	}
	getChildren(element?: CordaOperation): vscode.ProviderResult<CordaOperation[]> {
		if (!element) {
			return Object.keys(this.operations).map((key) => {
				return this.operations[key];
			})
		}
	}
	
	refresh(done?: boolean): void {
		if (done) {
			let runningKey = Object.keys(this.operations).find((key) => {
				return this.operations[key].contextValue === 'opRunning'
			});
			this.operations[runningKey!].contextValue = 'opNotRunning';
		}
		this._onDidChangeTreeData.fire();
	}
}

export class CordaOperation extends vscode.TreeItem {

	private runningTask: vscode.TaskExecution | undefined = undefined;

	setRunningTask = (taskEx: vscode.TaskExecution) => {
		this.runningTask = taskEx;
		this.contextValue = 'opRunning';
	}
	getRunningTask = () => {
		return this.runningTask;
	}
	stopRunningTask = () => {
		this.runningTask?.terminate();
		this.contextValue = 'opNotRunning';
		vscode.commands.executeCommand(Commands.OPERATIONS_REFRESH);
	}

	constructor(
		public readonly label: string,
		public readonly taskName: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		// public readonly opRunning: boolean,
		public readonly command?: vscode.Command,
		public readonly toolTip?: string | undefined,
	) {
		super(label, collapsibleState);
		this.tooltip = toolTip;
		this.contextValue = 'opNotRunning';
	}

	iconPath = new vscode.ThemeIcon('wrench');

}