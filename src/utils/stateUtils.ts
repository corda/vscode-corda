import * as vscode from 'vscode';
import { GlobalStateKeys, WorkStateKeys, Contexts, Constants, DebugConst, ViewPanels } from '../types/CONSTANTS';
import { PanelEntry, RunningNode, RunningNodesList } from '../types/types';
import { terminalIsOpenForNode } from './terminalUtils';

/**
 * check whether extension is running locally or in CDR (ide.corda.net)
 * @param context 
 */
export const localOrCordaNet = async (context: vscode.ExtensionContext) => {
    if (context.globalState.get(GlobalStateKeys.IS_ENV_CORDA_NET) === undefined) {
        const os = require('os');
        const env = (os.hostname().length == 12 && os.userInfo().username === 'coder') ? true : false;
        await context.globalState.update(GlobalStateKeys.IS_ENV_CORDA_NET, env);
    }
}

/**
 * resets relevant workspace and global states
 * @param context
 */
export const resetAllExtensionState = async (context: vscode.ExtensionContext) => {
    await resetCordaWorkspaceState(context);
    await resetCordaGlobalState(context);
}

/**
 * Resets Corda keys in workspaceState
 * @param context 
 */
const resetCordaWorkspaceState = async (context: vscode.ExtensionContext) => {
	WorkStateKeys.ALL_KEYS.forEach(async (key) => {
		await context.workspaceState.update(key, undefined);
    })
}

/**
 * Resets needed Corda settings in Global State.
 * @param context 
 */
const resetCordaGlobalState = async (context: vscode.ExtensionContext) => {
    GlobalStateKeys.GLOBAL_RESET_KEYS.forEach(async (key) => {
        await context.globalState.update(key, undefined);
    })
}

/**
 * Destroys instances of all running nodes of this project
 * @param context 
 */
export const disposeRunningNodes = async (context: vscode.ExtensionContext) => {
    await disposeRunningPanels(context);

    const globalRunningNodesList: RunningNodesList | undefined = context.globalState.get(GlobalStateKeys.RUNNING_NODES);
	const workspaceName = vscode.workspace.name;
	if (globalRunningNodesList && globalRunningNodesList[workspaceName!] != undefined) {

        const runningNodes: RunningNode[] = globalRunningNodesList[workspaceName!].runningNodes;
    
        runningNodes.forEach((node: RunningNode) => {
            terminalIsOpenForNode(node, true); // find node and dispose            
        });

		delete globalRunningNodesList[workspaceName!]; // remove on deactivate
	}

    await context.globalState.update(GlobalStateKeys.RUNNING_NODES, globalRunningNodesList);
    await context.workspaceState.update(WorkStateKeys.IS_NETWORK_RUNNING, false);
    await vscode.commands.executeCommand('setContext', Contexts.IS_NETWORK_RUNNING_CONTEXT, false);
    return true;
}

/**
 * Disposes all extension webview panels
 * @param context 
 */
export const disposeRunningPanels = async (context: vscode.ExtensionContext) => {
    const allPanels: PanelEntry | undefined = context.workspaceState.get(WorkStateKeys.VIEW_PANELS);
    if (allPanels !== undefined) {
        Object.keys(allPanels!).map(key => {
            if (key !== ViewPanels.WELCOME_PANEL) {
                allPanels![key]?.dispose(); // drop all panels but welcome
                delete allPanels.key
            }
        })
    }
    await context.workspaceState.update(WorkStateKeys.VIEW_PANELS, allPanels);
}