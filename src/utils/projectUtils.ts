import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { fileSync } from 'find';
import { v4 as uuidv4 } from 'uuid';
import { GlobalStateKeys, WorkStateKeys, Contexts, Constants, DebugConst } from '../types/CONSTANTS';
import { CordaNodesConfig, CordaTaskConfig, ParsedNode, DefinedCordaNode, LoginRequest, CordaNodeConfig, RunningNode, RunningNodesList } from '../types/types'
const gjs = require('../../gradleParser');
import { areNodesDeployed } from '../utils/networkUtils';
import { disposeRunningNodes, launchClient } from '../commandHandlers/networkCommands';
import {debug} from '../extension';

/**
 * Simple sleep function
 * @param ms 
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
    await resetCordaGlobalState(context); // reset Corda global states

    const projectCwd = vscode.workspace.workspaceFolders![0].uri.fsPath; // current working directory of the project
    const projectGradle = path.join(projectCwd, '/build.gradle'); // path to root gradle file

    // EXIT IF NOT CORDA
    if (!(await setIsProjectCorda(projectGradle, context))) { return false } 

    // PROJECT IS CORDA continue -------->

    setJDTpref(projectCwd); // inject java testrunner fix setting

    // if no client token set for Corda -> set a new token ; debug flag will pull a generic pre-set token
    if (debug) {
        await context.globalState.update(GlobalStateKeys.CLIENT_TOKEN, DebugConst.SERVER_CLIENT_TOKEN_DEVTEST);
    }
    if (context.globalState.get(GlobalStateKeys.CLIENT_TOKEN) === undefined) {
        await context.globalState.update(GlobalStateKeys.CLIENT_TOKEN, uuidv4());
    }

    // start client
    launchClient(context.globalState.get(GlobalStateKeys.CLIENT_TOKEN) as string)

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

    // currently allow ONE deployNodesConfig per project (pulls first element with deployNodes task) but future will allow multiple w/ selection
    let deployedNodes = taskToDeployedNodes(deployNodesConfigs![0]); // converts node records to DefinedNode objects

    // updates relevant workstate keys
    await context.workspaceState.update(WorkStateKeys.DEPLOY_NODES_BUILD_GRADLE, deployNodesConfigs![0].file)
    await context.workspaceState.update(WorkStateKeys.DEPLOY_NODES_LIST, deployedNodes);

    await areNodesDeployed(context); // checks if nodes are already deployed
    return true;
}

/**
 * Resets Corda keys in workspaceState
 * @param context 
 */
const resetCordaWorkspaceState = async (context: vscode.ExtensionContext) => {
	WorkStateKeys.ALL_KEYS.forEach(async (key) => {
		await context.workspaceState.update(key, undefined);
    })
}

/**
 * Resets needed Corda settings in Global State.
 * @param context 
 */
const resetCordaGlobalState = async (context: vscode.ExtensionContext) => {
    await disposeRunningNodes(context);
}

/**
 * structures parsing and write to workspaceState
 * 
 * HELPER for cordaCheckAndLoad
 * @param nodesConfig 
 */
const taskToDeployedNodes = (nodesTaskConfig: CordaTaskConfig):DefinedCordaNode[] => {
    let {file, task}:{file:string, task:CordaNodesConfig} = nodesTaskConfig; 

    let nodes:CordaNodeConfig = task.node;
    let nodeDefaults = task.nodeDefaults;
    let deployedNodes: DefinedCordaNode[] = [];
    Object.keys(nodes).forEach((val) => {
        // build up composites
        let node:ParsedNode = nodes[val]

        let hostAndPort = node.rpcSettings.address.split(":");
        
        let cred:{user:string, pass:string} = {user:"", pass:""};
        if (!node?.notary) { // NO CREDS for Notary - Don't store notary
            if (node?.rpcUsers) {
                cred.user = node.rpcUsers.user;
                cred.pass = node.rpcUsers.password;
            } else {
                cred.user = nodeDefaults.rpcUsers.user;
                cred.pass = nodeDefaults.rpcUsers.password;
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
                idx500: node.name,
                rpcPort: hostAndPort[1],
                x500: x500,
                nodeDef: node,
            })
        }

    })
    return deployedNodes;
}