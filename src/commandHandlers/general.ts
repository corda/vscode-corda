import * as vscode from 'vscode';
import { Constants } from '../CONSTANTS';
import Axios from 'axios';
import * as fs from 'fs';

/**
 * This function is for creating new projects from TEMPLATE or SAMPLE
 * Fetches a project from REPO using github api
 */
export const fetchTemplateOrSampleCallback = async () => {

    // quickPick choose template or sample
    const qpickItems = Object.keys(Constants.GITHUB_API).map((key, index) => { return key; });
    const requestedProject = await vscode.window.showQuickPick(qpickItems,
        {
            placeHolder: 'Choose a template or sample project'
        });
    if (requestedProject == undefined) return;

    // request save directory
    const path: vscode.Uri[] | undefined = await vscode.window.showOpenDialog({canSelectFiles: false, canSelectFolders: true, filters: {'Java': ['java']}, openLabel: 'Save Project'});
    if (path == undefined) return;
    const targetPath = vscode.Uri.joinPath(path[0], requestedProject);
    
    // make sure sample isn't already contained in directory
    if (fs.existsSync(targetPath.fsPath)) {
        vscode.window.showInformationMessage("Project already exists in chosen directory");
        return;
    }

    // fetch the template or sample
    const zipFile = await Axios.get(
        Constants.GITHUB_API[requestedProject],
        {responseType: 'arraybuffer'}
    );

    // unzip to disk
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(zipFile.data);
    const entryName = zip.getEntries()[0].entryName.slice(0,-1)
    zip.extractAllTo(path[0].fsPath, true);

    // correct verbose github naming
    await vscode.workspace.fs.rename(vscode.Uri.joinPath(path[0], entryName), targetPath)
        .then(() => {vscode.commands.executeCommand('vscode.openFolder', targetPath, true)});

}

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