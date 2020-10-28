import * as vscode from 'vscode';
import { ParsedNode, DefinedCordaNode, LoginRequest, RunningNode, RunningNodesList, CordappInfo } from '../types/types'
import { GlobalStateKeys, WorkStateKeys } from '../types/CONSTANTS'
import { terminalIsOpenForNode } from '../utils/terminalUtils';

export class CordaLocalNetworkProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
	readonly onDidChangeTreeData?: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(
		private readonly context: vscode.ExtensionContext,
		private deployNodesList: DefinedCordaNode[] | undefined = undefined,
		private workspaceRunningNodesList: RunningNode[] | undefined = undefined
	) {
		this.deployNodesList = this.context.workspaceState.get(WorkStateKeys.DEPLOY_NODES_LIST);
	}

	// check if node is currently running
	isNodeRunning = (n: DefinedCordaNodeTreeItem | DefinedCordaNode):boolean => { 
		return (this.context.workspaceState.get(WorkStateKeys.IS_NETWORK_RUNNING) as boolean) && terminalIsOpenForNode(n);
	}
	
	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}
	getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
		if (!element) { // children of TOP level Mock Network
			let nodeElements: DefinedCordaNodeTreeItem[] = [];
			this.deployNodesList?.forEach((node) => {
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
				const currentNodeCorDapps = this.workspaceRunningNodesList?.find(value => {
					return element.idx500 == value.idx500;
				})?.corDapps;

				items.push(new CorDapps(currentNodeCorDapps!));
			}
			return items;
		} else if (element instanceof CorDapps) { // details of CorDapps
			let items: vscode.TreeItem[] = [];
			element.cordapps.map(value => {
				items.push(new CorDappDetail(value));
			})
			return items;
		}
	}
	
	refresh(): void {
		const runningNodes: RunningNodesList | undefined = this.context.globalState.get(GlobalStateKeys.RUNNING_NODES) as RunningNodesList;
		const workspaceRunningNodes = !(Object.keys(runningNodes).length === 0 && runningNodes.constructor === Object) ? runningNodes[vscode.workspace.name!].runningNodes : [];
		this.workspaceRunningNodesList = workspaceRunningNodes;
		this._onDidChangeTreeData.fire();
	}
}

/**
 * Details of a single CorDapp
 */
export class CorDappDetail extends vscode.TreeItem {
	constructor(
		public readonly detail: CordappInfo,
	) {
		super(detail.shortName, vscode.TreeItemCollapsibleState.None);
		this.description = detail.type + ' | jar: ' + detail.name + ' | v. ' + detail.version;
		this.iconPath = new vscode.ThemeIcon('package');
		this.tooltip = 'jarHash: ' + detail.jarHash;
	}
}

/**
 * Containing class for parenting CorDapps
 */
export class CorDapps extends vscode.TreeItem {
	constructor(
		public readonly cordapps: CordappInfo[]
	) {
		super('Installed CorDapps', vscode.TreeItemCollapsibleState.Collapsed);
	}
}

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

