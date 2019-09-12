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

## Getting Started

Clone the V2 branch from the extension repo https://github.com/corda/vscode-corda/tree/V2
- From the local directory:

1. npm install
2. open in vscode (or "code ." from terminal)
3. Debug -> Start Debugging to run extension

## Design Notes

### Flow
extension.ts -> webviews (transaction Explorer, vaultQuery) <-> websocket (ClientWebsocket) <-> CordaRPCOps (NodeRPCClient) <-> Mock Network

### extension.ts (depends on parser.js)
Typecript extension file. <br/>
- Extension properties and contributed commands are defined in ./package.json
- 

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

---



## Release Notes

### 0.1.0

Initial pre-release of vscode-corda