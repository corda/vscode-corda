import * as vscode from 'vscode';
import { Constants, Commands, ViewPanels, WorkStateKeys } from '../types/CONSTANTS';
import Axios from 'axios';
import * as fs from 'fs';
import { CordaOperation } from '../treeDataProviders/cordaOperations';
import { panelStart } from '../utils/panelsUtils';

/**
 * This function is for creating new projects from TEMPLATE or SAMPLE
 * Fetches a project from REPO using github api
 */
export const newProjectCallback = async () => {
    // quickPick choose template or sample
    const qpickItems: vscode.QuickPickItem[] = Object.keys(Constants.GITHUB_API).map((key, index) => { 
        return {
            label: key,
            description: Constants.GITHUB_API[key].description
        } 
    });
    const requestedProject = await vscode.window.showQuickPick(qpickItems,
        {
            placeHolder: 'Choose a template or sample project'
        });
    if (requestedProject == undefined) return;

    // request save directory
    const path: vscode.Uri[] | undefined = await vscode.window.showOpenDialog({canSelectFiles: false, canSelectFolders: true, filters: {'Java': ['java']}, openLabel: 'Save Project'});
    if (path == undefined) return;
    const targetPath = vscode.Uri.joinPath(path[0], requestedProject.label);
    
    // make sure sample isn't already contained in directory
    if (fs.existsSync(targetPath.fsPath)) {
        vscode.window.showInformationMessage("Project already exists in chosen directory");
        return;
    }

    // fetch the template or sample
    const zipFile = await Axios.get(
        Constants.GITHUB_API[requestedProject.label].url,
        {responseType: 'arraybuffer'}
    );

    // unzip to disk
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(zipFile.data);

    var entryName: string = '';
    var baseEntryName: string = '';
    if (Constants.GITHUB_API[requestedProject.label].subFolder === '') { // no subfolder, take root repo
        entryName = zip.getEntries()[0].entryName.slice(0,-1)
        zip.extractAllTo(path[0].fsPath, true);
    } else {

        // SUBFOLDER PROJECTS - multiproject repos such as samples-java.
        // NOTE: currently these projects will be broken as they rely on ../constants.properties a parent dir file not saved.
        // should decide whether these constants should be moved into each folder...
        // alternative: to extract the ../constants.properties file -> move -> edit build.gradle...

        baseEntryName = zip.getEntries()[0].entryName;
        entryName = baseEntryName + Constants.GITHUB_API[requestedProject.label].subFolder;
        zip.extractEntryTo(entryName, path[0].fsPath, true, true); // Extracts the specific folder for project
    }

    // correct verbose github naming
    await vscode.workspace.fs.rename(vscode.Uri.joinPath(path[0], entryName), targetPath)
    .then(() => {vscode.commands.executeCommand('vscode.openFolder', targetPath, true)})
    .then(() => {
        // CLEAN UP for extraction of subdirs
        if (baseEntryName !== '') {
            vscode.workspace.fs.delete(vscode.Uri.joinPath(path[0], baseEntryName), {
                recursive: true,
                useTrash: false
            });
        }
    });

}

/**
 * Executing callback for running Gradle task
 * @param task 
 */
export const runGradleTaskCallback = async (task: string, cordaOp?: CordaOperation, context?: vscode.ExtensionContext) => {
    const deployNodesBuildGradle:any = context?.workspaceState.get(WorkStateKeys.DEPLOY_NODES_BUILD_GRADLE);

    const gradleTasks = await vscode.tasks.fetchTasks({ type: 'gradle'});
    var targetTask:any = undefined;
    if (deployNodesBuildGradle !== undefined) {
        targetTask = gradleTasks.find(({name}) => {
                if (name.includes(':')) { // check for module in name
                    return (deployNodesBuildGradle.includes(name.split(':')[0]) && // match module for build.gradle
                    name.includes(task)) // match task name
                } else {
                    return name.includes(task);
                }  
            }
        )
    } else {
        targetTask = gradleTasks.find(
            ({name}) => name === task // match task name
        )
    }
    
    await new Promise(async (resolve) => {
        const disposable = vscode.tasks.onDidEndTaskProcess((e) => {
            if (e.execution.task === targetTask) {
            disposable.dispose();
            resolve();
            }
        });
        try {
            // TODO: grab return value for option to cancel
            await vscode.tasks.executeTask(targetTask!).then((taskExecution) => {
                if (cordaOp !== undefined) {
                    cordaOp.setRunningTask(taskExecution);
                    vscode.commands.executeCommand(Commands.OPERATIONS_REFRESH);
                }
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
export const openFileCallback = (uri: vscode.Uri) => {
    vscode.workspace.openTextDocument(uri).then((doc: vscode.TextDocument) => {
        vscode.window.showTextDocument(doc, {preview: false}); // open in new tab
    })
}

/**
 * Show Welcome
 * @param context 
 */
export const welcomeCallback = async (context: vscode.ExtensionContext) => {
    await panelStart(ViewPanels.WELCOME_PANEL, undefined, context);
}