import * as vscode from 'vscode';
import { ParsedNode, DefinedCordaNode, LoginRequest, RunningNode, RunningNodesList } from '../types/types'
import { WorkStateKeys } from '../types/CONSTANTS'
import { terminalIsOpenForNode } from '../utils/terminalUtils';

export class CordaLocalNetworkProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
	readonly onDidChangeTreeData?: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private readonly context: vscode.ExtensionContext) {
	}

	// check if node is currently running
	isNodeRunning = (n: DefinedCordaNodeTreeItem | DefinedCordaNode):boolean => { 
		return (this.context.workspaceState.get(WorkStateKeys.IS_NETWORK_RUNNING) as boolean) && terminalIsOpenForNode(n);
	}
	
	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}
	getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
		let deployNodesList:DefinedCordaNode[] | undefined = this.context.workspaceState.get(WorkStateKeys.DEPLOY_NODES_LIST);
		if (!element) { // children of TOP level Mock Network
			let nodeElements: DefinedCordaNodeTreeItem[] = [];
			deployNodesList?.forEach((node) => {
				// format to existing structure for display
				nodeElements.push(new DefinedCordaNodeTreeItem(
					node.x500.name,
					node,
					(this.isNodeRunning(node)), // whether node is Online
					vscode.TreeItemCollapsibleState.Collapsed
				));
			})
			return nodeElements;

		} else if (element instanceof DefinedCordaNodeTreeItem) { // children of valid Nodes
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
				new CorDappDetail("Initiator", "simple template flow", vscode.TreeItemCollapsibleState.None), // STATIC placeholder - iterate on ALL apps from CorDapps object
				new CorDappDetail("TokenIssueFlowInitiator", "issue token", vscode.TreeItemCollapsibleState.None)
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
export class DefinedCordaNodeTreeItem extends vscode.TreeItem implements DefinedCordaNode {

	idx500: string;
	loginRequest: LoginRequest;
	rpcPort: string;
	x500: { name: string; city: string; country: string; };
	nodeDef: ParsedNode;

	constructor(
		public readonly label: string,
		public readonly nodeDetails: DefinedCordaNode,
		public readonly isOnline: boolean,
		public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
	) {
		super(label, collapsibleState);
		const onlineTag = (isOnline) ? '\u25CF' : '\u25CB'
		this.description = ' - ' + onlineTag; // STATIC Placeholder, replace with live data
		this.contextValue = (isOnline) ? 'nodeOnline' : 'nodeOffline';
		this.idx500 = nodeDetails.idx500;
		this.loginRequest = nodeDetails.loginRequest;
		this.rpcPort = nodeDetails.rpcPort;
		this.x500 = nodeDetails.x500;
		this.nodeDef = nodeDetails.nodeDef;
	}

	iconPath = new vscode.ThemeIcon('person');
}

