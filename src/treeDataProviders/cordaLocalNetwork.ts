import * as vscode from 'vscode';
import { DefinedNode, RunningNode, RunningNodesList } from '../types/types'
import { GlobalStateKeys, WorkStateKeys } from '../types/CONSTANTS'
import {} from '../commandHandlers/networkCommands';
import { terminalIsOpenForNode } from '../utils/terminalUtils';

export class CordaLocalNetworkProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
	readonly onDidChangeTreeData?: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private readonly context: vscode.ExtensionContext) {
	}

	// check if node is currently running
	isNodeRunning = (n: Node | DefinedNode):boolean => { 
		return (this.context.workspaceState.get(WorkStateKeys.IS_NETWORK_RUNNING) as boolean) && terminalIsOpenForNode(n);
	}
	
	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}
	getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
		let deployNodesList:DefinedNode[] | undefined = this.context.workspaceState.get(WorkStateKeys.DEPLOY_NODES_LIST);
		if (!element) { // children of TOP level Mock Network
			let nodeElements: Node[] = [];
			deployNodesList?.forEach((node) => {
				// format to existing structure for display
				nodeElements.push(new Node(
					node.x500.name,
					node,
					(this.isNodeRunning(node)), // whether node is Online
					vscode.TreeItemCollapsibleState.Collapsed
				));
			})
			return nodeElements;

		} else if (element instanceof Node) { // children of valid Nodes
			let items: vscode.TreeItem[] = [
				new NodeDetail('Location', element.nodeDetails.x500.city + ", " + element.nodeDetails.x500.country), // details are derived from element (Node)
				new NodeDetail('RPC Port', element.nodeDetails.loginRequest.port)
			];
			if (element.isOnline) {
				items.push(new CorDapps('Installed CorDapps', vscode.TreeItemCollapsibleState.Collapsed))
			}
			return items;
		} else if (element instanceof CorDapps) { // details of CorDapps
			return [
				new CorDappDetail("App1", "app detail place holder", vscode.TreeItemCollapsibleState.None), // STATIC placeholder - iterate on ALL apps from CorDapps object
				new CorDappDetail("App2", "app detail place holder", vscode.TreeItemCollapsibleState.None)
			];

		}
	}
	
	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

/**
 * Details of a single CorDapp
 */
export class CorDappDetail extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly detail: string,
		public readonly collapsibleState?: vscode.TreeItemCollapsibleState
	) {
		super(label, collapsibleState);
		this.description = detail;
		this.iconPath = new vscode.ThemeIcon('package');
	}
}

/**
 * Containing class for parenting CorDapps
 */
export class CorDapps extends vscode.TreeItem {}

export class NodeDetail extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly detail: string,
		public readonly collapsibleState?: vscode.TreeItemCollapsibleState
	) {
		super(label, collapsibleState);
		this.description = detail;
		// set icon
		switch (label) {
			case 'Location':
				this.iconPath = new vscode.ThemeIcon('globe');
				break;
			case 'RPC Port':
				this.iconPath = new vscode.ThemeIcon('broadcast');
				break;
		}
	}
}

/**
 * Represents a Node on the Mock Network
 */
export class Node extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly nodeDetails: DefinedNode,
		public readonly isOnline: boolean,
		public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
	) {
		super(label, collapsibleState);
		const onlineTag = (isOnline) ? '\u25CF' : '\u25CB'
		this.description = ' - ' + onlineTag; // STATIC Placeholder, replace with live data
		this.contextValue = (isOnline) ? 'nodeOnline' : 'nodeOffline';
	}

	iconPath = new vscode.ThemeIcon('person');
}

