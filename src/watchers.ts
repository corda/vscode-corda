import * as vscode from 'vscode';
import { WorkStateKeys, Commands } from './types/CONSTANTS';
import { areNodesDeployed, isNetworkRunning } from './utils/networkUtils';
import * as fs from 'fs';
import { DefinedCordaNode } from './types/types';
import { MessageType, WindowMessage } from './logviewer/types';
import { cordaCheckAndLoad } from './utils/projectUtils';

/**
 * Watcher for changes to build.gradle files
 * 
 * TODO: should execute refreshes on extension
 */
export const getBuildGradleFSWatcher = (context: vscode.ExtensionContext) => {
    const pattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders![0], '**/*.gradle');
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);
    watcher.onDidChange((event) => { 
        console.log(`gradle file changed: ${event.fsPath}`); 

        // cordaCheckAndLoad(context); // rescan gradle
        vscode.window.showInformationMessage("build.gradle was updated. Re-deploy nodes if needed.");
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
    vscode.tasks.onDidStartTask((taskStartEvent) => {
        const task = taskStartEvent.execution.task;
        switch (task.name) {
            case 'assemble':
            case 'build':
            case 'test':
            case 'clean':
                break;
        }
    })
    vscode.tasks.onDidEndTask((taskEndEvent) => {
		const task = taskEndEvent.execution.task;
		switch (task.name) {
			case 'deployNodes':
                areNodesDeployed(context);
				isNetworkRunning(context);
				break;
            case 'clean':
				areNodesDeployed(context);
                isNetworkRunning(context);
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