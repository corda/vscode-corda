import * as vscode from 'vscode';
import { CordaNodesConfig, CordaNodeConfig, DeployedNode, CordaNode } from '../types'
import { WorkStateKeys } from '../CONSTANTS'

export class CordaMockNetworkProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
	readonly onDidChangeTreeData?: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private readonly context: vscode.ExtensionContext) {
	}
	
	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}
	getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
		let deployNodesConfig:DeployedNode[] | undefined = this.context.workspaceState.get(WorkStateKeys.DEPLOY_NODES_CONFIG);
		if (!element) { // children of TOP level Mock Network
			let nodeElements: Node[] = [];
			deployNodesConfig?.forEach((node) => {
				// format to existing structure for display
				nodeElements.push(new Node(
					node.x500.name,
					node,
					vscode.TreeItemCollapsibleState.Collapsed
				));
			})
			return nodeElements;

		} else if (element instanceof Node) { // children of valid Nodes
			let items: vscode.TreeItem[] = [
				new NodeDetail('Location', element.nodeDetails.x500.city + ", " + element.nodeDetails.x500.country), // details are derived from element (Node)
				new NodeDetail('RPC Port', element.nodeDetails.loginRequest.port)
			];
			if (this.context.workspaceState.get(WorkStateKeys.NETWORK_RUNNING)) {
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
		public readonly nodeDetails: DeployedNode,
		public readonly collapsibleState?: vscode.TreeItemCollapsibleState
	) {
		super(label, collapsibleState);
		this.description = 'Corda OS v4.3 | Platform v5'; // STATIC Placeholder
	}

	iconPath = new vscode.ThemeIcon('person');
	contextValue = 'node';
}

