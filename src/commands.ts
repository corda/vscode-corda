import { Constants, GRADLE_TASKS_EXTENSION_ID } from './CONSTANTS';
import * as vscode from 'vscode';
import { ClassSig, ObjectSig, InterfaceSig } from './typeParsing';
import Axios from 'axios';
import * as fs from 'fs';
import { ExtensionApi as GradleApi, RunTaskOpts, Output } from 'vscode-gradle';
import * as util from 'util';

// CALLBACKS

/**
 * Fetches a project from REPO using github api
 */
export const fetchTemplateOrSampleCallback = async () => {

    // quickPick choose template or sample
    const qpickItems = Object.keys(Constants.gitHubApi).map((key, index) => { return key; });
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
        Constants.gitHubApi[requestedProject],
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
 * 
 * @param projectObjects dictionary of Corda types, used for inheritance selection
 */
export const cordaFlowsAddCallback = async (projectObjects): Promise<void> => {
	
    const qpickItems = (projectObjects.projectClasses.flowClasses as ClassSig[]).map((sig) => {
            return sig.name
        }).concat(Constants.flowBaseClass);
    const qpickPlaceHolder = 'Choose a parent flow to extend';
    const inputPlaceHolder = 'Enter the name of the flow';
    const commandSource = 'cordaFlows';
    // sourceMap <baseType>:[<templateClassName>,<URL>]
    const sourceMap = {'FlowLogic':['BaseFlow','https://raw.githubusercontent.com/corda/vscode-corda/v0.2.0/resources/BaseFlow.java']};

    addCommandHelper(qpickItems, qpickPlaceHolder, inputPlaceHolder, commandSource, sourceMap);
}

export const cordaContractsAddCallback = async (projectObjects): Promise<void> => {
	
    const qpickItems = (projectObjects.projectClasses.contractClasses as ObjectSig[])
        .concat(projectObjects.projectInterfaces.contractInterfaces)
        .map((sig) => {
            return sig.name
        }).concat(Constants.contractBaseInterface);
    const qpickPlaceHolder = 'Choose a parent contract interface or class to extend';
    const inputPlaceHolder = 'Enter the name of the contract';
    const commandSource = 'cordaContracts';
    // sourceMap <baseType>:[<templateClassName>,<URL>]
    const sourceMap = {'Contract':['BaseContract','https://raw.githubusercontent.com/corda/vscode-corda/v0.2.0/resources/BaseContract.java']};

    addCommandHelper(qpickItems, qpickPlaceHolder, inputPlaceHolder, commandSource, sourceMap);
}

export const cordaContractStatesAddCallback = async (projectObjects): Promise<void> => {
    const qpickItems = (projectObjects.projectClasses.contractStateClasses as ObjectSig[])
        .concat(projectObjects.projectInterfaces.contractStateInterfaces)
        .map((sig) => {
            return sig.name
        }).concat(Constants.contractStateBaseInterfaces);
    const qpickPlaceHolder = 'Choose a parent state interface or class to extend';
    const inputPlaceHolder = 'Enter the name of the state';
    const commandSource = 'cordaStates';
    // sourceMap <baseType>:[<templateClassName>,<URL>]
    const sourceMap = {'ContractState':['BaseContractState','https://raw.githubusercontent.com/corda/vscode-corda/v0.2.0/resources/BaseContractState.java']};

    addCommandHelper(qpickItems, qpickPlaceHolder, inputPlaceHolder, commandSource, sourceMap);
}

/**
 * Helper for cordaFlowsAddCallback, cordaContractsAddCallback, and cordaContractStatesAddCallback
 * @param qpickItems 
 * @param qpickPlaceHolder 
 * @param inputPlaceHolder 
 * @param commandSource 
 * @param sourceMap 
 */
const addCommandHelper = async (qpickItems, qpickPlaceHolder, inputPlaceHolder, commandSource, sourceMap) => {
	let path: vscode.Uri[] | undefined = await vscode.window.showOpenDialog({canSelectFiles: false, canSelectFolders: true, filters: {'Java': ['java']}, openLabel: 'Save File'});
	if (path == undefined) return;

	let stateBase = await vscode.window.showQuickPick(qpickItems,
	{
		placeHolder: qpickPlaceHolder
	});
	if (stateBase == undefined) return;

	let fileName = await vscode.window.showInputBox({
		placeHolder: inputPlaceHolder,
		validateInput: text => {
			return undefined;
			// - must start with capital
			// - must have valid chars
			// - must not already exist!
		}
	});
	if (fileName == undefined) return;

	// check Base / http mapping to fetch correct template
    let stateBaseText:string = await (await Axios.get(sourceMap[stateBase!][1])).data;
    stateBaseText = stateBaseText.replace(sourceMap[stateBase][0], fileName) // inject custom ClassName

    fileName = fileName.includes('.java') ? fileName : fileName + '.java'; // append .java if needed

	const fileUri = vscode.Uri.joinPath(path?.pop()!, fileName!);
	var uint8array = new TextEncoder().encode(stateBaseText);

	// write file -> refresh Tree -> open file
	await vscode.workspace.fs.writeFile(fileUri, uint8array).then(() => {
		const classToAdd: ClassSig = new ClassSig(fileName!.replace('.java',''), '', [stateBase!], fileUri);
		vscode.commands.executeCommand(commandSource + '.refresh', classToAdd);
	}).then(() => vscode.commands.executeCommand('corda.openFile', fileUri));
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
            await (await vscode.tasks.executeTask(targetTask!));
        } catch (e) {
            console.error('There was an error starting the task:', e.message);
        }
    });
}

export const openFile = async (uri: vscode.Uri) => {
    vscode.workspace.openTextDocument(uri).then((doc: vscode.TextDocument) => {
        vscode.window.showTextDocument(doc, {preview: false}); // open in new tab
    })
}
