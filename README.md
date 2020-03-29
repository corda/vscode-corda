# vscode-corda README

The vscode-corda extension provides tools for developing CorDapps on the [Corda](https://corda.net) platform.

## Features

The following features are accessible through the command palette. <br/> ⇧⌘P (Windows, Linux Ctrl+Shift+P)

- Corda Clean project (remove previous build files)
- Corda Build project (build the CorDapp using existing gradle)
- Corda Run Tests (unit tests)
- Corda Deploy Nodes (setup mock network from gradle file)
- Corda Run Nodes (bring nodes online)
- Corda Show Transaction Explorer
    - See Node details
    - View all states in a Node's vault by transaction including it's StateRef and property values.
    - List all registered flows on the Node
    - Run a flow with automatic detection of required parameters and autocomplete.
- Corda Show Vault Query View
    - Create custom queries on the selected Node's vault. Available criteria include:
        - StateStatus
        - ContractStateType
        - StateRef
        - Notary
        - Time Condition (future feature with Core 4.3)
        - Relevancy Status
        - Participants

## Requirements

- NodeJS 12+
- Oracle JDK 8
- Gradle 5.5+
- Corda 4.0+

## Using the Extension

The vscode-corda extension works will activate when you open a Corda project as your root folder in the ide. In order for the project to be detected you must have a valid build.gradle file present in the project folder. When detected, an indication is shown on the status bar.

![Status](https://raw.githubusercontent.com/corda/vscode-corda/master/images/corda-project-status.PNG)

Available commands are accessible through the command palette. ⇧⌘P (Windows, Linux Ctrl+Shift+P)

![CordaCommands](https://raw.githubusercontent.com/corda/vscode-corda/master/images/corda-command-palette.PNG)

Corda Run Nodes requires that nodes have previously been deployed. If this is not the case, you will be prompted to automatically deploy. When your nodes are running they reside in individual terminal instances in vscode. This allows both monitoring and shell interaction if desired. It may take a few moments for each node to launch.

![CordaRunNodes](https://raw.githubusercontent.com/corda/vscode-corda/master/images/corda-run-nodes.PNG)


Show Transaction Explorer and Show Vault Query View allow interaction with your running nodes. (Quick tip: It is also possible to connect to nodes you have deployed outside the IDE as long as the nodes address/ports match those in your build.gradle).

Each interactive view lets you select a node to interact with from you mock network. You will be presented with a drop down list off available running nodes. Choosing a node will provide information about the node and expose the interface. You can change nodes at anytime.

The transaction explorer allows you to choose flows from any CorDapp on the node and run them. Required parameters will automatically be displayed and auto-completes based on network data will be available.

![TransactionView](https://raw.githubusercontent.com/corda/vscode-corda/master/images/transaction-view.PNG)

The vault query view shows all the transactions hashes and states in the vault of the selected node. It allows you to filter by QueryCriteria by choosing selections on the query builder. Selecting a transaction entry will open up additional data. Filter options are automatically generated based on available nodes on your network. For the StateRef criteria there is autocomplete functionality. The 'Party' filter is a UNION (e.g. selecting PartyA and PartyB will show all transactions involving either).

![QueryView](https://raw.githubusercontent.com/corda/vscode-corda/master/images/vaultquery-view.PNG)

## Getting Started with Contributing

Clone the V2 branch from the extension repo https://github.com/corda/vscode-corda/tree/V2
- From the local directory:

1. npm install
2. open in vscode (or "code ." from terminal)
3. Debug -> Start Debugging to run extension

**UPDATE (Mar 29, 2020)**

Note this project now uses the node-server submodule available at https://github.com/corda/node-server this must be initialised with the following commands.

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
extension.ts -> webviews (transaction Explorer, vaultQuery) <-> websocket (ClientWebsocket) <-> CordaRPCops (NodeRPCClient) <-> Mock Network

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
- Create websockets to communicate with the ClientWebSocket
- Passes the node details retrieved through the extension.ts file onto the client websocket where RPC connections are established
- Uses these remote connections to post and get information from the RPCClients


#### websocket (ClientWebSocket)
Java server side code. <br/>
- RPCClients are opened when connection requests come from the webviews.
- Maintains knowledge of these RPCClients so that, when requests come from the views, the ClientWebSocket communicates with the correct RPCClient
- Passes information between the views and the RPCClients

#### CordaRPCops
RPCClients that communicate with the nodes <br />
- RPC interfaces defined in Corda that allow communicated with nodes via a message quieie protocol.
- Responds to queries from the ClientWebSocket for retrieving information or running flows.

#### Mock Network
Network through which the nodes communicate

### File Structure
#### Views
##### Flow Explorer
The flow explorer allows a user to run flows from a chosen node through the web client. They can also see the unconsumed states currently in the selected nodes vault. 

transactionExplorer.js -> FlowExplorerIndex.js -> (NodeInfo.js, FlowInfoDisplay.js, NodeSelector.js, SnackBarWrapper.js, VaultTransactionDisplay.js -> StateCard.js )

- <b>transactionExplorer</b> is the uppermost react file. The other files are mounted onto this one.
- <b> FlowExplorerIndex </b>is the main component for this webview. It keeps track of the node data, the websocket connections, and the data retrieved from the <em>ClientWebSocket</em> (sending this information down to other components as required). Start flow requests are also made from this component.
- <b>FlowInfoDisplay </b>recieves information about the available flows and the parameters required for these flows from the <em>FlowExplorerIndex</em>. It allows users to choose and run these flow, passing the data back up to the <em>FlowExplorerIndex</em> to be run through the websocket.
- <b>NodeInfo </b>recieves information about the currently selected node and displays it.
- <b>NodeSelector</b> recieves the nodes available in the gradle from the <em>FlowExplorerIndex</em> and allows the user to choose one to communcate with. It passes the chosen node back up to the <em>FlowExplorerIndex</em> to establish the websocket.
- <b>SnackBarWrapper</b> is the error/info/success display. When the <em>FlowExplorerIndex</em> recieves a message from the websocket that the user should be aware of (an error, a flow starting to run, a flow successfully finishing) this is passed to the SnackBarWrapper.
- <b>VaultTransactionDisplay</b> is a table that displays transactions. It recieves a map of these transactions from the <em>FlowExplorerIndex</em> (only that contain UNCONSUMED states) and displays these along with the states that were output from the transaction.
- <b>StateCard </b>is a component that displays state information recieved from the <em>VaultTransactionDisplay</em>. Each card represents one state.

##### Vault Query
The Vault Query view allows a user to explore the vault of a chosen node. They are able to run custom queries using a list of criteria options and can see the transactions returned from these queries in the table display.

vaultQuery.js > VaultQueryIndex.js -> (NodeSelector.js, NodeInfo.js, VaultTransactionDisplay.js -> StateCard.js, VQueryBuilder.js, SnackBarWrapper.js)

- <b>vaultQuery</b> is the uppermost file onto which the components are mounted.
- <b>VaultQueryIndex </b> is the main component for this webview. It keeps track of the node data, the websocket connections, and the data retrieved from the <em>ClientWebSocket</em> (sending this information down to other components as required). 
- <b>NodeInfo </b>recieves information about the currently selected node and displays it.
- <b>NodeSelector</b> recieves the nodes available in the gradle from the <em>VaultQueryIndex</em> and allows the user to choose one to communcate with. It passes the chosen node back up to the <em>VaultQueryIndex</em> to establish the websocket.
- <b>SnackBarWrapper</b> is the error/info/success display. When the <em>VaultQueryIndex</em> recieves a message from the websocket that the user should be aware of (an error, a flow starting to run, a flow successfully finishing) this is passed to the SnackBarWrapper.
- <b> VQueryBuilder</b> contains options that allow a user to custom craft query criteria for a chosen node. Choices of participants, notaries, and ContractTypes are extracted from data loaded from the node. When options are selected, these are passed back up to <em>VaultQueryIndex</em> and the query is run through the websocket connection, changing the transactions displayed in the <em>VaultTransactionDisplay</em>.
- <b>VaultTransactionDisplay</b> is a table that displays transactions. It recieves a map of these transactions from the <em>VaultQueryIndex</em> and displays these along with the states that were output from the transaction.
- <b>StateCard </b>is a component that displays state information recieved from the <em>VaultTransactionDisplay</em>. Each card represents one state.

#### Client
The client is used to intermediate communcations between the RPCClients and the webviews.

- <b> boundary/ClientWebSocket.java</b> handles all incoming and outgoing messages through the websocket. It uses a switch statement to change its behaviour depending on the incoming command, including handling connections (where it will establish RPCCLient connections). This file also handles VaultTracking (where messages are sent each time the nodes database is updated with a new transaction).
 - <b> NodeRPCClient.java </b> contains the logic for handling most of the commands. It contains a map of possible commands that are associated with handler coder. 
 - <b> entities/Message.java </b> this object defines the messages that are sent and recieved through the websocket.
 - <b> entities/MessageDecoder.java </b> converts incoming messages from JSON strings to Message objects
 - <b> entities/MessageEncoder.java </b> converts outgoing messages from Message objects to JSON strings.
 - <b> entities/adapters/* </b> defines how various classes are handled when they are converted into JSON.
 - <b> entities/customExceptions/* </b> defines custom errors that are thrown in the client code. 

## Known Issues/ TODO

- Can't currently define custom criteria using time 
    - This is due to the type 'comparable' not being whitelisted in any version of Corda prior to version 4.3
- Can only currently specify dates in the forms dd/MM/yy in flow     parameters.

---



## Release Notes

See CHANGELOG.md for details