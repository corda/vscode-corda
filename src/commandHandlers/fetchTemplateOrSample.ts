import { Constants } from '../CONSTANTS';
import * as vscode from 'vscode';
import Axios from 'axios';
import * as fs from 'fs';

/**
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