import * as vscode from 'vscode';

/**
 * Executing callback for running Gradle task
 * @param task 
 */
export const runGradleTaskCallback = async (task: string) => {
    const targetTask = (await vscode.tasks.fetchTasks({ type: 'gradle' })).find(
        ({ name }) => name === task
    );
    
    await new Promise(async (resolve) => {
        const disposable = vscode.tasks.onDidEndTaskProcess((e) => {
            if (e.execution.task === targetTask) {
            disposable.dispose();
            resolve();
            }
        });
        try {
            // TODO: grab return value for option to cancel
            await vscode.tasks.executeTask(targetTask!).then(async () => {
            });
        } catch (e) {
            console.error('There was an error starting the task:', e.message);
        }
    });
}

/**
 * helper for opening a URI/file in the current editor.
 * @param uri 
 */
export const openFile = async (uri: vscode.Uri) => {
    vscode.workspace.openTextDocument(uri).then((doc: vscode.TextDocument) => {
        vscode.window.showTextDocument(doc, {preview: false}); // open in new tab
    })
}