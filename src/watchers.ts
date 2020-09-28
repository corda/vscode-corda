import * as vscode from 'vscode';
import { WorkStateKeys } from './CONSTANTS';
import { areNodesDeployed, isNetworkRunning } from './projectUtils';
import * as fs from 'fs';

// Watcher for gradle.build refresh
export const getBuildGradleFSWatcher = () => {
    const pattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders![0], '**/*.gradle');
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);
    watcher.onDidChange((event) => { 
        console.log(`gradle file changed: ${event.fsPath}`); 
        // updateWorkspaceFolders(); // updater here
        vscode.window.showInformationMessage("build.gradle was updated. Re-deploy nodes if needed.");
    })
    return watcher;
}

/**
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