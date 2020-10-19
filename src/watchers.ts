import * as vscode from 'vscode';
import { WorkStateKeys, Commands, Constants } from './types/CONSTANTS';
import { areNodesDeployed, isNetworkRunning } from './utils/networkUtils';
import * as fs from 'fs';
import { DefinedCordaNode } from './types/types';
import { MessageType, WindowMessage } from './logviewer/types';
import { cordaCheckAndLoad, parseBuildGradle } from './utils/projectUtils';

/**
 * Watcher for changes to build.gradle files
 * 
 * TODO: should execute refreshes on extension
 */
export const getBuildGradleFSWatcher = (context: vscode.ExtensionContext) => {
    const pattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders![0], '**/*.gradle');
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);
    watcher.onDidChange(async (event) => { 
        console.log(`gradle file changed: ${event.fsPath}`); 
        const projectCwd = vscode.workspace.workspaceFolders![0].uri.fsPath;

        await vscode.commands.executeCommand(Commands.NETWORK_STOP); // STOP any running nodes
        await parseBuildGradle(projectCwd, context); // rescan gradle
        await vscode.commands.executeCommand(Commands.NETWORK_REFRESH); // refresh network tree
        
        // ask to redeploy nodes now?
        vscode.window.showInformationMessage("build.gradle was updated. Would you like to deploy nodes?", 'Yes', 'No')
            .then((selection) =>{
                if (selection === 'Yes') {
                    vscode.commands.executeCommand(Commands.NETWORK_DEPLOYNODES, true);
                }
            });
    })
    context.subscriptions.push(watcher);
}

/**
 * Watches for changes to the persistent file state of the Cordform network
 * /build/nodes/ and refreshes trackers on areNodesDeployed and isNetworkRunning
 * 
 * @param context
 */
export const nodesFSWatcher = (context: vscode.ExtensionContext) => {
    let buildPath:string | undefined = context.workspaceState.get(WorkStateKeys.DEPLOY_NODES_BUILD_GRADLE);
    buildPath = buildPath?.split('build.gradle')[0];
    var watcher = fs.watch(buildPath!, {recursive: true});
    watcher.on('change', async (event, filename) => {
        // console.log('build/nodes changed');
        const runningTasks = vscode.tasks.taskExecutions;
        const deployNodeTaskRunning = runningTasks.some((tE) => {
            return tE.task.name == 'deployNodes'
        })
        
        if (!deployNodeTaskRunning) {
            await areNodesDeployed(context);
            await isNetworkRunning(context);
        }       
    })
    return watcher;
}

/**
 * Activates listeners for gradle task events
 * @param context 
 */
export const activateEventListeners = (context: vscode.ExtensionContext) => {
    vscode.tasks.onDidStartTask(async (taskStartEvent) => {
        const task = taskStartEvent.execution.task;
        switch (task.name) {
            case 'deployNodes':
            case 'clean':
                // stop network for deployNodes and clean
                await vscode.commands.executeCommand(Commands.NETWORK_STOP);
                break;
            case 'assemble':
            case 'build':
            case 'test':
                break;
        }
    })
    vscode.tasks.onDidEndTask((taskEndEvent) => {
		const task = taskEndEvent.execution.task;
		switch (task.name) {
			case 'deployNodes': // runs through to 'clean' block
				isNetworkRunning(context); // update is network running on completion
            case 'clean':
				areNodesDeployed(context); // update whether nodes are deployed
                vscode.commands.executeCommand(Commands.OPERATIONS_REFRESH, true);
                break;
            case 'assemble':
            case 'build':
            case 'test':
                vscode.commands.executeCommand(Commands.OPERATIONS_REFRESH, true);
                break;
		}
	})
	vscode.window.onDidCloseTerminal(async (terminal) => {
		await isNetworkRunning(context);
	})
}

export const logFSWatcher = (definedNode: DefinedCordaNode, filepath: string, context: vscode.ExtensionContext) => {
    fs.watchFile(filepath, (curr, prev) => {
        let panel: vscode.WebviewPanel | undefined = context.workspaceState.get('logviewer'+definedNode.x500.name);
        panel?.webview.postMessage({
            messageType: MessageType.NEW_LOG_ENTRIES,
            filepath,
        } as WindowMessage)
    })
}