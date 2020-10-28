import { Constants, Commands, WorkStateKeys } from '../types/CONSTANTS';
import * as vscode from 'vscode';
import { ClassSig, ObjectSig } from '../types/typeParsing';
import Axios from 'axios';

/**
 * Creates a new Flow in project
 * @param projectObjects dictionary of Corda types, used for inheritance selection
 */
export const cordaFlowsAddCallback = (context: vscode.ExtensionContext) => {
    const projectObjects:{projectClasses: any, projectInterfaces:any} | undefined = context.workspaceState.get(WorkStateKeys.PROJECT_OBJECTS);
    
    // get a defaultURI
    const firstFlowURI: string | undefined = (projectObjects!.projectClasses.flowClasses.length > 0) ? (projectObjects!.projectClasses.flowClasses as ObjectSig[])[0].file?.toString() : undefined;
    const flowDefaultURI: vscode.Uri = (firstFlowURI !== undefined) ? vscode.Uri.parse(firstFlowURI.match("(.*)(\/.*\.[^.]+$)")![1]!) : vscode.workspace.workspaceFolders![0].uri;

    const qpickItems = (projectObjects!.projectClasses.flowClasses as ClassSig[]).map((sig) => {
            return sig.name
        }).concat(Constants.FLOW_BASE_CLASS);
    const qpickPlaceHolder = 'Choose a parent flow to extend';
    const inputPlaceHolder = 'Enter the name of the flow';
    // const commandSource = 'cordaFlows';
    // sourceMap <baseType>:[<templateClassName>,<URL>]
    const sourceMap = {'FlowLogic':['BaseFlow','https://raw.githubusercontent.com/corda/vscode-corda/v0.2.0/resources/BaseFlow.java']};

    addCommandHelper(flowDefaultURI, qpickItems, qpickPlaceHolder, inputPlaceHolder, sourceMap, context);
}

/**
 * Creates a new Contract in project
 * @param projectObjects 
 */
export const cordaContractsAddCallback = (context: vscode.ExtensionContext) => {
	const projectObjects:{projectClasses: any, projectInterfaces:any} | undefined = context.workspaceState.get(WorkStateKeys.PROJECT_OBJECTS);

    // get a defaultURI
    const firstContractURI: string | undefined = (projectObjects!.projectClasses.contractClasses.length > 0) ? (projectObjects!.projectClasses.contractClasses as ObjectSig[])[0].file?.toString() : undefined;
    const contractDefaultURI: vscode.Uri = (firstContractURI !== undefined) ? vscode.Uri.parse(firstContractURI.match("(.*)(\/.*\.[^.]+$)")![1]!) : vscode.workspace.workspaceFolders![0].uri;

    const qpickItems = (projectObjects!.projectClasses.contractClasses as ObjectSig[])
        .concat(projectObjects!.projectInterfaces.contractInterfaces)
        .map((sig) => {
            return sig.name
        }).concat(Constants.CONTRACT_BASE_INTERFACE);
    const qpickPlaceHolder = 'Choose a parent contract interface or class to extend';
    const inputPlaceHolder = 'Enter the name of the contract';
    // const commandSource = 'cordaContracts';
    // sourceMap <baseType>:[<templateClassName>,<URL>]
    const sourceMap = {'Contract':['BaseContract','https://raw.githubusercontent.com/corda/vscode-corda/v0.2.0/resources/BaseContract.java']};

    addCommandHelper(contractDefaultURI, qpickItems, qpickPlaceHolder, inputPlaceHolder, sourceMap, context);
}

/**
 * Creates a new ContractState in project
 * @param projectObjects 
 */
export const cordaContractStatesAddCallback = (context: vscode.ExtensionContext) => {
    const projectObjects:{projectClasses: any, projectInterfaces:any} | undefined = context.workspaceState.get(WorkStateKeys.PROJECT_OBJECTS);

    // get a defaultURI
    const firstContractStateURI: string | undefined = (projectObjects!.projectClasses.contractStateClasses.length > 0) ? (projectObjects!.projectClasses.contractStateClasses as ObjectSig[])[0].file?.toString() : undefined;
    const contractStateDefaultURI: vscode.Uri = (firstContractStateURI !== undefined) ? vscode.Uri.parse(firstContractStateURI.match("(.*)(\/.*\.[^.]+$)")![1]!) : vscode.workspace.workspaceFolders![0].uri;

    const qpickItems = (projectObjects!.projectClasses.contractStateClasses as ObjectSig[])
        .concat(projectObjects!.projectInterfaces.contractStateInterfaces)
        .map((sig) => {
            return sig.name
        }).concat(Constants.CONTRACTSTATE_BASE_INTERFACES);
    const qpickPlaceHolder = 'Choose a parent state interface or class to extend';
    const inputPlaceHolder = 'Enter the name of the state';
    // const commandSource = 'cordaStates';
    // sourceMap <baseType>:[<templateClassName>,<URL>]
    const sourceMap = {'ContractState':['BaseContractState','https://raw.githubusercontent.com/corda/vscode-corda/v0.2.0/resources/BaseContractState.java']};

    addCommandHelper(contractStateDefaultURI, qpickItems, qpickPlaceHolder, inputPlaceHolder, sourceMap, context);
}

/**
 * Helper for cordaFlowsAddCallback, cordaContractsAddCallback, and cordaContractStatesAddCallback
 * @param qpickItems 
 * @param qpickPlaceHolder 
 * @param inputPlaceHolder 
 * @param commandSource 
 * @param sourceMap 
 */
const addCommandHelper = async (defaultUri, qpickItems, qpickPlaceHolder, inputPlaceHolder, sourceMap, context: vscode.ExtensionContext) => {
	let path: vscode.Uri[] | undefined = await vscode.window.showOpenDialog({defaultUri: defaultUri,canSelectFiles: false, canSelectFolders: true, filters: {'Java': ['java']}, openLabel: 'Save File'});
    if (path == undefined) return;
    
    const requestType: string = Object.keys(sourceMap)[0]; // FlowLogic, Contract, ContractState

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
    let stateBaseText:string = await (await Axios.get(sourceMap[requestType][1])).data;
    const className:string = fileName.includes('.java') ? fileName.split('.')[0] : fileName; // className should NOT include suffix
    stateBaseText = stateBaseText.replace(sourceMap[requestType][0], className) // inject className

    // parent is CLASS or INTERFACE?
    const projectObjects:{projectClasses: any, projectInterfaces:any} | undefined = context.workspaceState.get(WorkStateKeys.PROJECT_OBJECTS);
    let classesOfType: ClassSig[];
    switch (requestType) {
        case 'FlowLogic':
            classesOfType = projectObjects!.projectClasses.flowClasses;
            break;
        case 'Contract':
            classesOfType = projectObjects!.projectClasses.contractClasses;
            break;
        default:
            classesOfType = projectObjects!.projectClasses.contractStateClasses;
            break;
    }
    const parentIsClass: boolean = (classesOfType.find((value) => {
        return value.name === stateBase;
    }) !== undefined) || requestType === Constants.FLOW_BASE_CLASS[0];

    // swap implements/extends as needed when injecting parent
    if (parentIsClass) {
        stateBaseText = stateBaseText.replace('implements', 'extends');
        if (requestType === 'FlowLogic' && stateBase !== 'FlowLogic') {
            stateBaseText = stateBaseText.replace('extends ' + requestType + '<Void>', 'extends ' + stateBase);
        } else {
            stateBaseText = stateBaseText.replace('extends ' + requestType, 'extends ' + stateBase);
        }
    } else {
        stateBaseText = stateBaseText.replace('extends', 'implements');
        stateBaseText = stateBaseText.replace('implements ' + requestType, 'implements ' + stateBase);
    }

    fileName = fileName.includes('.java') ? fileName : fileName + '.java'; // fileName SHOULD include suffix

	const fileUri = vscode.Uri.joinPath(path?.pop()!, fileName!);
	var uint8array = new TextEncoder().encode(stateBaseText);

	// write file -> refresh Tree -> open file
    await vscode.workspace.fs.writeFile(fileUri, uint8array)
        .then(() => vscode.commands.executeCommand(Commands.CORDA_OPEN_FILE, fileUri));
}