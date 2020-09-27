import * as vscode from 'vscode';

// Watcher for gradle.build refresh
export const getBuildGradleFSWatcher = () => {
    let pattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders![0].uri.toString(), '**/*.gradle');
    let watcher = vscode.workspace.createFileSystemWatcher(pattern);
    watcher.onDidChange((event) => { 
        watcher.dispose();
        console.log(`gradle file changed: ${event.fsPath}`); 
        // updateWorkspaceFolders(); // updater here
        vscode.window.showInformationMessage("build.gradle was updated. Re-deploy nodes if needed.");
    })
    return watcher;
}
