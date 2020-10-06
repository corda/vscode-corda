import { Constants, Commands } from '../types/CONSTANTS';
import * as vscode from 'vscode';
import { ClassSig, ObjectSig } from '../types/typeParsing';
import Axios from 'axios';

/**
 * Creates a new Flow in project
 * @param projectObjects dictionary of Corda types, used for inheritance selection
 */
export const cordaFlowsAddCallback = (projectObjects) => {
	
    const qpickItems = (projectObjects.projectClasses.flowClasses as ClassSig[]).map((sig) => {
            return sig.name
        }).concat(Constants.FLOW_BASE_CLASS);
    const qpickPlaceHolder = 'Choose a parent flow to extend';
    const inputPlaceHolder = 'Enter the name of the flow';
    const commandSource = 'cordaFlows';
    // sourceMap <baseType>:[<templateClassName>,<URL>]
    const sourceMap = {'FlowLogic':['BaseFlow','https://raw.githubusercontent.com/corda/vscode-corda/v0.2.0/resources/BaseFlow.java']};

    addCommandHelper(qpickItems, qpickPlaceHolder, inputPlaceHolder, commandSource, sourceMap);
}

/**
 * Creates a new Contract in project
 * @param projectObjects 
 */
export const cordaContractsAddCallback = (projectObjects) => {
	
    const qpickItems = (projectObjects.projectClasses.contractClasses as ObjectSig[])
        .concat(projectObjects.projectInterfaces.contractInterfaces)
        .map((sig) => {
            return sig.name
        }).concat(Constants.CONTRACT_BASE_INTERFACE);
    const qpickPlaceHolder = 'Choose a parent contract interface or class to extend';
    const inputPlaceHolder = 'Enter the name of the contract';
    const commandSource = 'cordaContracts';
    // sourceMap <baseType>:[<templateClassName>,<URL>]
    const sourceMap = {'Contract':['BaseContract','https://raw.githubusercontent.com/corda/vscode-corda/v0.2.0/resources/BaseContract.java']};

    addCommandHelper(qpickItems, qpickPlaceHolder, inputPlaceHolder, commandSource, sourceMap);
}

/**
 * Creates a new ContractState in project
 * @param projectObjects 
 */
export const cordaContractStatesAddCallback = (projectObjects) => {
    const qpickItems = (projectObjects.projectClasses.contractStateClasses as ObjectSig[])
        .concat(projectObjects.projectInterfaces.contractStateInterfaces)
        .map((sig) => {
            return sig.name
        }).concat(Constants.CONTRACTSTATE_BASE_INTERFACES);
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
	}).then(() => vscode.commands.executeCommand(Commands.CORDA_OPEN_FILE, fileUri));
}