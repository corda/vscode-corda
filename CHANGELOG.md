# Change Log

All notable changes to the "vscode-corda" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.1.1] - 2020-08-06
### Patch
- Token auth added for sandboxing spring server to vscode instance
- Fix: error launching runNodes from nested deployNodes
- Fix: login options when transitioning between local and remote nodes

## [0.1.0] - 2020-04-16
### Beta Release
- Performance enhancements; extension size reduced, dependency tuning.
- Revamped UI
- Transaction Explorer and Vault Query View are now integrated into a single dynamic WebView.
- Two additional views added:
  - Dashboard: with various node information
  - Network: shows regional display of nodes available on network map.
- Remote Node connection w/ SSH Tunnel
- Additional contextual notifications
- Better themes support
- Compatibility for JDT compiler
- Auto-refresh of changes in deployNodes task
- Various bug fixes


## [0.0.3] - 2019-11-22
### Incremental
- Transaction Explorer now allows flows with overloaded constructors. User will be able to choose constructor via argument list.
- UI scaling corrected on Vault Query View
- Build artifacts removed from repo

## [0.0.2] - 2019-10-23
### Bugfix
- Global flag on Corda-Project changed to workspace/folder level

## [0.0.1] - 2019-10-22
### Initial Release
- Launch gradle tasks: clean, build, deployNodes, and runNodes
- View transactions and initiate flows with auto complete on parameters through transaction view
- Query the vault of node through vault query view