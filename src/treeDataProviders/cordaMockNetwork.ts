import * as vscode from 'vscode';

export class CordaMockNetworkProvider implements vscode.TreeDataProvider<CordaTool | vscode.TreeItem> {
	
	private _onDidChangeTreeData: vscode.EventEmitter<CordaTool | undefined | void> = new vscode.EventEmitter<CordaTool | undefined | void>();
	readonly onDidChangeTreeData?: vscode.Event<CordaTool | undefined | void>;

	constructor(private readonly mockNetwork: Object[]) {
	}
	
	getTreeItem(element: CordaTool): vscode.TreeItem {
		return element;
	}
	getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
		if (!element) { // children of TOP level Mock Network
			let nodes:Node[] = [];
			this.mockNetwork.forEach(node => {
				nodes.push(new Node(node['name'], [node['location'], node['port']], vscode.TreeItemCollapsibleState.Collapsed))
			});
			return nodes;

		} else if (element instanceof Node) { // children of valid Nodes
			return [
				new NodeDetail('Location', element.nodeDetails[0]), // details are derived from element (Node)
				new NodeDetail('RPC Port', element.nodeDetails[1]),
				new CorDapps('Installed CorDapps', vscode.TreeItemCollapsibleState.Collapsed) // STATIC placeholder - pass ALL apps to Constructor
			];

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
		public readonly nodeDetails: any,
		public readonly collapsibleState?: vscode.TreeItemCollapsibleState
	) {
		super(label, collapsibleState);
		this.description = 'Corda OS v4.3 | Platform v5'; // STATIC Placeholder
	}

	iconPath = new vscode.ThemeIcon('person');
	contextValue = 'node';
}

export class CordaTool extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState?: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
		switch (command?.command) {
			case 'corda.runFlow':
				this.iconPath = new vscode.ThemeIcon('run');
				break;
			case 'corda.vaultQuery':
				this.iconPath = new vscode.ThemeIcon('search')
				break;
			case 'corda.logViewer':
				this.iconPath = new vscode.ThemeIcon('telescope')
				break;
		}
	}
}

