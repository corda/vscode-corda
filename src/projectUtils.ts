import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { fileSync } from 'find';
import { v4 as uuidv4 } from 'uuid';
import { GlobalStateKeys, WorkStateKeys, Contexts } from './CONSTANTS';
import { CordaNodesConfig, CordaTaskConfig, CordaNode, DefinedNode, LoginRequest, CordaNodeConfig, RunningNode, RunningNodesList } from './types'
import { findTerminal, terminalIsOpenForNode } from './terminals';
const gjs = require('../gradleParser');

/**
 * Fix which is used for JUnit testrunner to correctly work
 * - may not be necessary if using 'vscode-gradle' must confirm
 * 
 * HELPER for cordaCheckAndLoad
 * TODO: move from fs to vscode.workspace API
 * @param projectCwd 
 */
const setJDTpref = (projectCwd: string) => { // for java-testrunner compat. in gradle projects
	const settingsPath = path.resolve(projectCwd, '.settings');
    const filePath = path.resolve(settingsPath,'org.eclipse.jdt.core.prefs');

    if (!fs.existsSync(filePath)) {
        if (!fs.existsSync(settingsPath)){
            fs.mkdirSync(settingsPath);
        }

        const content = 'org.eclipse.jdt.core.compiler.codegen.methodParameters=generate';

        fs.writeFile(filePath, content, (err : any) => {
            if (err) {
                console.error(err)
                return
            }
        });
    }
}

/**
 * Returns whether project is a CorDapp project
 * HELPER for cordaCheckAndLoad
 * TODO: Move this check to representation.buildscript.ext dep on the parsing
 * @param buildGradleFile 
 * @param context 
 */
const setIsProjectCorda = async (buildGradleFile: string, context: vscode.ExtensionContext) => {
    let isGradle = false;
    if (fs.existsSync(buildGradleFile)) {
        let contents = fs.readFileSync(buildGradleFile);
        if (contents.includes('corda')) {
            console.log("Project is Corda");
            isGradle = true;  
        }
    } 

    await context.workspaceState.update(WorkStateKeys.PROJECT_IS_CORDA, isGradle); // set state
    vscode.commands.executeCommand('setContext', Contexts.PROJECT_IS_CORDA_CONTEXT, isGradle); // set context
    return isGradle;
}

/**
 * Entry-point for project level checks and intitial parses
 * @param context 
 */
export const cordaCheckAndLoad = async (context: vscode.ExtensionContext) => {

    await resetCordaWorkspaceState(context); // reset Corda Keys in workspaceState
    await disposeRunningNodes(context);

    const projectCwd = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const projectGradle = path.join(projectCwd, '/build.gradle');

    // EXIT IF NOT CORDA
    if (!(await setIsProjectCorda(projectGradle, context))) { return false } 
    // PROJECT IS CORDA continue -------->

    setJDTpref(projectCwd); // inject java testrunner fix setting

    // No client token set for Corda -> set a new token
    if (context.globalState.get(GlobalStateKeys.CLIENT_TOKEN) === undefined) {
        await context.globalState.update(GlobalStateKeys.CLIENT_TOKEN, uuidv4());
    }

    // Parse build.gradle for deployNodes configuration and store to workspace
    let gradleTaskConfigs: CordaTaskConfig[] | undefined = []
    let files = fileSync(/build.gradle$/, projectCwd);
    for(let i = 0; i < files.length; i++){
        let parsed: any = await gjs.parseFile(files[i]);
        // NOTE: currently only concerned with a partial parse of the gradle (task)
        let entry: CordaTaskConfig = {file: files[i], task: parsed.task};
        gradleTaskConfigs.push(entry);
    }
    let deployNodesConfigs: CordaTaskConfig[] | undefined = gradleTaskConfigs.filter((value: CordaTaskConfig) => {
        return value.task?.node && true;
    })

    // currently allow ONE deployNodesConfig per project but future will allow multiple w/ selection
    let deployedNodes = taskToDeployedNodes(deployNodesConfigs![0]);

    await context.workspaceState.update(WorkStateKeys.DEPLOY_NODES_BUILD_GRADLE, deployNodesConfigs![0].file)
    await context.workspaceState.update(WorkStateKeys.DEPLOY_NODES_LIST, deployedNodes);

    return true;
}

/**
 * Resets Corda keys in workspaceState
 * @param context 
 */
export const resetCordaWorkspaceState = async (context: vscode.ExtensionContext) => {
	WorkStateKeys.ALL_KEYS.forEach(async (key) => {
		await context.workspaceState.update(key, undefined);
    })
}

/**
 * structures parsing and write to workspaceState
 * 
 * HELPER for cordaCheckAndLoad
 * @param nodesConfig 
 */
const taskToDeployedNodes = (nodesTaskConfig: CordaTaskConfig):DefinedNode[] => {
    let {file, task}:{file:string, task:CordaNodesConfig} = nodesTaskConfig; 

    let nodes:CordaNodeConfig = task.node;
    let nodeDefaults = task.nodeDefaults;
    let deployedNodes: DefinedNode[] = [];
    Object.keys(nodes).forEach((val) => {
        // build up composites
        let node:CordaNode = nodes[val]

        let hostAndPort = node.rpcSettings.address.split(":");
        
        let cred:{user:string, pass:string} = {user:"", pass:""};
        if (!node?.notary) { // NO CREDS for Notary
            if (node?.rpcUsers) {
                cred.user = node.rpcUsers.user;
                cred.pass = node.rpcUsers.password;
            } else {
                cred.user = nodeDefaults.rpcUsers.user;
                cred.pass = nodeDefaults.rpcUsers.password;
            }
        }

        let loginRequest: LoginRequest = {
            hostName: hostAndPort[0],
            port: hostAndPort[1],
            username: cred.user,
            password: cred.pass
        }
        let x500: {name:string, city: string, country: string} = {
            name: node.name.match("O=(.*),L")![1],
            city: node.name.match("L=(.*),C")![1],
            country: node.name.match("C=(.*)")![1]
        }

        // add jarDir to node
        node.jarDir = file.split('build.gradle')[0] + 'build/nodes/' + x500.name;

        // push on DeployedNode
        deployedNodes.push({
            loginRequest: loginRequest,
            id: node.name,
            rpcPort: hostAndPort[1],
            x500: x500,
            nodeConf: node,
        })
    })
    return deployedNodes;
}

/**
 * Determines if nodes have been deployed based on existence of the artifacts.
 * @param context 
 */
export const areNodesDeployed = async (context: vscode.ExtensionContext) => {
    let nodesPath:string | undefined = context.workspaceState.get(WorkStateKeys.DEPLOY_NODES_BUILD_GRADLE);
    nodesPath = nodesPath?.split('build.gradle')[0] + 'build/nodes';
    
    const result = fs.existsSync(nodesPath); // check if the NODES persistant structure exists
    await context.workspaceState.update(WorkStateKeys.ARE_NODES_DEPLOYED, result);
    vscode.commands.executeCommand('setContext', Contexts.ARE_NODES_DEPLOYED_CONTEXT, result);
    return result
}

/**
 * Determines if this projects local network is running by searching for global list of runningNodes
 * tied to the workspace and confirming against the terminals
 * 
 * Also FILTERS and discards records of runningNodes that are no longer active
 * @param context 
 */
export const isNetworkRunning = async (context: vscode.ExtensionContext) => {
    let result = false;
    const globalRunningNodes: RunningNodesList | undefined = context.globalState.get(GlobalStateKeys.RUNNING_NODES);
    const workspaceName = vscode.workspace.name!;
    if (globalRunningNodes && (workspaceName in globalRunningNodes)) { 
        
        // Check a node terminal IS active and adjust RUNNING_NODES if needed
        const runningNodes: RunningNode[] = globalRunningNodes[workspaceName].runningNodes;
        // const openTerminals: readonly vscode.Terminal[] = vscode.window.terminals;

        // const nameCheckPred = (t, n:RunningNode) => { // predicate to check composed name
        //     return t.name == (n.deployedNode.x500.name + " : " + n.deployedNode.rpcPort)
        // }

        runningNodes.forEach((node, index) => {
            // ODD that no access to node.terminal.name ?? using composed name
            if (!terminalIsOpenForNode(node)) { // no matching terminal (may have manually closed this)
                runningNodes.splice(index, 1); // removes the item from list
            }
        })
        // if there has been a change in workspace running nodes - update global list
        if (runningNodes.length > 0 && runningNodes.length < globalRunningNodes[workspaceName].runningNodes.length) { 
            globalRunningNodes[workspaceName] = {runningNodes};
            await context.globalState.update(GlobalStateKeys.RUNNING_NODES, globalRunningNodes);
            result = true;
        } else if (runningNodes.length == 0) { // there are NO running nodes - remove workspace from global list
            delete globalRunningNodes[workspaceName];
            await context.globalState.update(GlobalStateKeys.RUNNING_NODES, globalRunningNodes);
            result = false;
        } else { // all nodes are running as expected
            result = true;
        }
    };
  
    await context.workspaceState.update(WorkStateKeys.IS_NETWORK_RUNNING, result);
    vscode.commands.executeCommand('setContext', Contexts.IS_NETWORK_RUNNING_CONTEXT, result);
    return result;
}

/**
 * Destroys instances of all running nodes of this project
 * @param context 
 */
export const disposeRunningNodes = async (context: vscode.ExtensionContext) => {
    const globalRunningNodesList: RunningNodesList | undefined = context.globalState.get(GlobalStateKeys.RUNNING_NODES);
	const workspaceName = vscode.workspace.name;
	if (globalRunningNodesList && globalRunningNodesList[workspaceName!] != undefined) {

        const runningNodes: RunningNode[] = globalRunningNodesList[workspaceName!].runningNodes;
    
        runningNodes.forEach((node: RunningNode) => {
            terminalIsOpenForNode(node, true); // find node and dispose            
        });

		delete globalRunningNodesList[workspaceName!]; // remove on deactivate
	}

    await context.globalState.update(GlobalStateKeys.RUNNING_NODES, globalRunningNodesList);
    return true;
}