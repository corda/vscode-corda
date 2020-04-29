# vscode-corda README

The vscode-corda extension provides tools for developing CorDapps on the [Corda](https://corda.net) platform.

## Features

The following features are accessible through the command palette. <br/> ⇧⌘P (Windows, Linux Ctrl+Shift+P)

- Corda Clean project (remove previous build files)
- Corda Assemble project (build w/o test)
- Corda Build project (build + test the CorDapp using existing gradle)
- Corda Run Tests (unit tests)
- Corda Deploy Nodes (setup mock network from gradle file)
- Corda Run Nodes (bring nodes online)
- Corda Stop Running Nodes (available when noddes are running)
- Corda Show Node Explorer

## Requirements

- NodeJS 12+
- Oracle JDK 8
- Gradle 5.5+
- Corda 4.0+

## Using the Extension

The vscode-corda extension works will activate when you open a Corda project as your root folder in the ide. In order for the project to be detected you must have a valid build.gradle file present in the project folder. When detected, an indication is shown on the status bar.

![Status](https://raw.githubusercontent.com/corda/vscode-corda/master/images/corda-project-status.PNG)

Available commands are accessible through the command palette. ⇧⌘P (Windows, Linux Ctrl+Shift+P)

![CordaCommands](https://raw.githubusercontent.com/corda/vscode-corda/master/images/0.1.0_Corda_commands.png)

Corda Run Nodes requires that nodes have previously been deployed. If this is not the case, you will be prompted to automatically deploy. When your nodes are running they reside in individual terminal instances in vscode. This allows both monitoring and shell interaction if desired. It may take a few moments for each node to launch.

![CordaRunNodes](https://raw.githubusercontent.com/corda/vscode-corda/master/images/0.1.0_Corda_runnodes.png)

**The Node Explorer View** allows interaction with your running nodes. By default the explorer will establish a connection the the first available (running) node from your build.gradle deployNodes task. If there is no available node, the explorer will default to manual connection mode and allow you to connect to either a local or remote node (SSH available).

![NodeExplorerView](https://raw.githubusercontent.com/corda/vscode-corda/master/images/0.1.0_CordaNE_login.png)

There are four primary subviews which allow monitoring and interacting with your Corda Nodes:

**Dashboard** - Display of various node information details (requires Corda 4.3+)

![NodeExplorerDash](https://raw.githubusercontent.com/corda/vscode-corda/master/images/0.1.0_CordaNE_dashboard.png)

**Network Map** - Overview of all parties registered on the current node's Corda network as well as details and location.

![NodeExplorerNetworkMap](https://raw.githubusercontent.com/corda/vscode-corda/master/images/0.1.0_CordaNE_networkmap.png)

**Transaction** - Allows viewing of previous transaction details including input/output states. Create new transactions easily through UI for any CorDapp installed on the node.

![NodeExplorerTransaction](https://raw.githubusercontent.com/corda/vscode-corda/master/images/0.1.0_CordaNE_transaction.png)

**Vault** - Allows instant querying of vault contents using dynamic filters. Results are instantly updated.

![NodeExplorerVault](https://raw.githubusercontent.com/corda/vscode-corda/master/images/0.1.0_CordaNE_vaultexp.png)

**Settings** (manual connection ONLY) - For local and remote connections to nodes not defined in the build.gradle, the extension must know the associated directory of CorDapp Jars. You will be prompted to enter this path in settings.

![NodeExplorerSettings](https://raw.githubusercontent.com/corda/vscode-corda/master/images/0.1.0_CordaNE_settings.png)



## Getting Started with Contributing

Clone the V2 branch from the extension repo https://github.com/corda/vscode-corda/tree/V2
- From the local directory:

1. npm install
2. open in vscode (or "code ." from terminal)
3. Debug -> Start Debugging to run extension

**UPDATE (Mar 29, 2020)**

Note this project now uses submodules for `server` and `src`, which contain the node-server and node explorer respectively, after cloning these submodules must be initialised with the following commands.

1) ``git submodule init``
2) ``git submodule update``* 

*this command must also be run after any pull request which includes updates to the submodule. An alternative is to do pull requests with the following option:
``git pull --recurse-submodules``

**Other submodule commands:**

* Fetch and merge the latest node-server submodule code
  - ``git submodule update --remote``

* Doing work on the submodule i.e. changing files in ./server
  - submodules default to a detached head, so change to server directory and checkout a branch
  - ``cd ./server``
  - ``git checkout master``
  - Add or commit your changes as usual.

* To PULL submodule updates from server side, if there are changes on your local branch either merge or rebase with the pull
  - From MAIN project directory
  - `` git submodule update --remote --merge `` OR
  - ``git submodule update --remote --rebase``

* To PUSH submodule updates to server side
  - From MAIN project directory
  - ``git push --recurse-submodules=on-demand``


## Design Notes

### Flow Of Communcation
extension.ts -> webviews (node-explorer) <-> springboot server <-> CordaRPCops (NodeRPCClient) <-> Network (local/remote)

#### extension.ts (depends on parser.js)
Typecript extension file. <br/>
- Extension properties and contributed commands are defined in ./package.json
- Defines the extension properties and loads them into the vscode environment
- Scans the gradle files in the active workspace to discover nodes and  passes this information to the views 
- Loads the ClientWebSocket jar file
- Launches the nodes associated with the current workspace
- Loads the views

#### webviews
React JS and CSS files. <br/>
- axios to communicate with the server end-points
- Passes the node details retrieved through the extension.ts file (or entered manually) to enable RPC connections
- Uses these remote connections to post and get information from the RPCClients


#### springboot server
Java server side code. <br/>
- RPCClients are opened when connection requests come from the webviews.
- Passes information between the views and the RPCClients

#### CordaRPCops
RPCClients that communicate with the nodes <br />
- RPC interfaces defined in Corda that allow communicated with nodes via a message quieie protocol.
- Responds to queries from the ClientWebSocket for retrieving information or running flows.

#### Mock Network
Network through which the nodes communicate



## Known Issues/ TODO

- VSCode's Java TestRunner extension uses the Eclipse JDT compiler and requires a prefs file in .settings to pass the -parameters flag to the JVM. The extension will automatically create this prefs file if it does not exist. However, you may have to open the command-palette (Ctrl+Shift+P / Cmd+Shift+P) and select `Java: Clean the Java language server workspace` The first time after this change, if you receive problems with the TestRunner.

---



## Release Notes

See CHANGELOG.md for details