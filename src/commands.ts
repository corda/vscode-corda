import { Constants } from './extension';
import * as vscode from 'vscode';
import { ClassSig, ObjectSig, InterfaceSig } from './typeParsing';
import Axios from 'axios';

// CALLBACKS

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
    const sourceMap = {'FlowLogic':'https://raw.githubusercontent.com/corda/vscode-corda/v0.2.0/resources/BaseFlow.java'};

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
    const sourceMap = {'Contract':'https://raw.githubusercontent.com/corda/vscode-corda/v0.2.0/resources/BaseContract.java'};

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
    const sourceMap = {'ContractState':'https://raw.githubusercontent.com/corda/vscode-corda/v0.2.0/resources/BaseContractState.java'};

    addCommandHelper(qpickItems, qpickPlaceHolder, inputPlaceHolder, commandSource, sourceMap);
}

const addCommandHelper = async (qpickItems, qpickPlaceHolder, inputPlaceHolder, commandSource, sourceMap) => {
	let result: vscode.Uri[] | undefined = await vscode.window.showOpenDialog({canSelectFiles: false, canSelectFolders: true, filters: {'Java': ['java']}});
	if (result == undefined) return;

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
	}).then(name => { return (name?.includes('.java') ? name : name + '.java') }); // append .java if needed
	if (fileName == undefined) return;

	// check Base / http mapping to fetch correct template
	const stateBaseText = await Axios.get(sourceMap[stateBase!]);
	const fileUri = vscode.Uri.joinPath(result?.pop()!, fileName!);
	var uint8array = new TextEncoder().encode(stateBaseText.data);

	// write file -> refresh Tree -> open file
	await vscode.workspace.fs.writeFile(fileUri, uint8array).then(() => {
		const classToAdd: ClassSig = new ClassSig(fileName.replace('.java',''), '', [stateBase!], fileUri);
		vscode.commands.executeCommand(commandSource + '.refresh', classToAdd);
	}).then(() => vscode.commands.executeCommand('corda.openFile', fileUri));
}
