import * as vscode from 'vscode';
import { GlobalStateKeys, WorkStateKeys, Contexts, Commands } from '../types/CONSTANTS';
import { RunningNode, RunningNodesList } from '../types/types';
import { terminalIsOpenForNode } from './terminalUtils';
import * as fs from 'fs';


/**
 * Determines if nodes have been deployed based on existence of the artifacts.
 * @param context 
 */
export const areNodesDeployed = async (context: vscode.ExtensionContext) => {
    let nodesPath:string | undefined = context.workspaceState.get(WorkStateKeys.DEPLOY_NODES_BUILD_GRADLE);
    nodesPath = nodesPath?.split('build.gradle')[0] + 'build/nodes';
    
    var result = fs.existsSync(nodesPath); // check if nodes directory exists
    const cordaGlob = await vscode.workspace.findFiles('**/corda.jar');
    result = result && (cordaGlob.length > 0); // check if there is an active CordaJar available.
    await context.workspaceState.update(WorkStateKeys.ARE_NODES_DEPLOYED, result);
    vscode.commands.executeCommand('setContext', Contexts.ARE_NODES_DEPLOYED_CONTEXT, result);
    return result
}

/**
 * Determines if this projects local network is running by searching for global list of runningNodes
 * tied to the workspace and confirming against the terminals
 * 
 * Also FILTERS and discards records of runningNodes that are no longer active
 * @param context 
 */
export const isNetworkRunning = async (context: vscode.ExtensionContext) => {
    let result = false;
    const globalRunningNodes: RunningNodesList | undefined = context.globalState.get(GlobalStateKeys.RUNNING_NODES);
    const workspaceName = vscode.workspace.name!;
    if (globalRunningNodes && (workspaceName in globalRunningNodes)) { 
        
        // Check a node terminal IS active and adjust RUNNING_NODES if needed
        const runningNodes: RunningNode[] = [...globalRunningNodes[workspaceName].runningNodes];
        
        runningNodes.forEach((node, index) => {
            if (!terminalIsOpenForNode(node)) { // no matching terminal (may have manually closed this)
                runningNodes.splice(index, 1); // removes the item from list
            }
        })
        // if there has been a change in workspace running nodes - update global list and refresh UI
        if (runningNodes.length > 0 && runningNodes.length < globalRunningNodes[workspaceName].runningNodes.length) { 
            globalRunningNodes[workspaceName] = {runningNodes};
            await context.globalState.update(GlobalStateKeys.RUNNING_NODES, globalRunningNodes);
            vscode.commands.executeCommand(Commands.NETWORK_REFRESH);
            result = true;
        } else if (runningNodes.length == 0) { // there are NO running nodes - remove workspace from global list
            delete globalRunningNodes[workspaceName];
            await context.globalState.update(GlobalStateKeys.RUNNING_NODES, globalRunningNodes);
            result = false;
        } else { // all nodes are running as expected
            result = true;
        }
    };
  
    // if network running state has changed refresh the Local Network
    if (context.workspaceState.get(WorkStateKeys.IS_NETWORK_RUNNING) !== result) {
        vscode.commands.executeCommand(Commands.NETWORK_REFRESH);
    }
    await context.workspaceState.update(WorkStateKeys.IS_NETWORK_RUNNING, result);
    vscode.commands.executeCommand('setContext', Contexts.IS_NETWORK_RUNNING_CONTEXT, result);
    return result;
}