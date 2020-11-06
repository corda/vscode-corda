import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { fileSync } from 'find';
import { v4 as uuidv4 } from 'uuid';
import { GlobalStateKeys, WorkStateKeys, Contexts, Constants, DebugConst, Commands } from '../types/CONSTANTS';
import { CordaNodesConfig, CordaTaskConfig, ParsedNode, DefinedCordaNode, LoginRequest, CordaNodeConfig } from '../types/types'
import { areNodesDeployed } from '../utils/networkUtils';
import { launchClient } from '../commandHandlers/networkCommands';
import {debug} from '../extension';
import { resetAllExtensionState } from './stateUtils';

const gjs = require('../../gradleParser');

/**
 * Simple sleep function
 * @param ms 
 */
export const sleep = (ms: any) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Entry-point for project level checks and intitial parses
 * @param context 
 */
export const cordaCheckAndLoad = async (context: vscode.ExtensionContext) => {

    await resetAllExtensionState(context); // state resets

    const projectCwd = vscode.workspace.workspaceFolders![0].uri.fsPath; // current working directory of the project
    const projectGradle = path.join(projectCwd, '/build.gradle'); // path to root gradle file

    // EXIT IF NOT a Corda Project
    if (!(await setIsProjectCorda(projectGradle, context))) { return false } 
    
    // Show Corda Welcome
    vscode.commands.executeCommand(Commands.SHOW_CORDA_WELCOME);

    // Check JDK 1.8 Installed and home/runconfig set in settings.json
    const currentRedHatJava: string = vscode.extensions.getExtension('redhat.java')!.packageJSON.version;
    if (
        !(context.globalState.get(GlobalStateKeys.IS_ENV_CORDA_NET)) && // running on local environment
        (parseFloat(currentRedHatJava) >= 0.65) && // > 0.64.1 (last fully 1.8 compatible version)
        !(await isJDK18Available(context))) { // confirm properly set JDK 1.8)
            return false; 
        }; 

    // PROJECT IS CORDA continue with loads -------->

    setJDTpref(projectCwd); // inject java testrunner fix setting

    // if no client token set for Corda -> set a new token ; debug flag will pull a generic pre-set token
    if (debug) {
        await context.globalState.update(GlobalStateKeys.CLIENT_TOKEN, DebugConst.SERVER_CLIENT_TOKEN_DEVTEST);
    } else if (context.globalState.get(GlobalStateKeys.CLIENT_TOKEN) === undefined) {
        await context.globalState.update(GlobalStateKeys.CLIENT_TOKEN, uuidv4());
    }

    // start client for RPC
    launchClient(context.globalState.get(GlobalStateKeys.CLIENT_TOKEN) as string, context)

    // parse the current build.gradle
    await parseBuildGradle(projectCwd, context);

    return true;
}

/**
 * parses the root build.gradle for defined nodes, writes values to workspace state and determines if there is a current deployment
 * @param projectCwd 
 * @param context 
 */
export const parseBuildGradle = async (projectCwd: string, context: vscode.ExtensionContext) => {
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
}

/**
 * Checks existence of JDK18 runtime configuration (needed for Java Language Server 0.64.1 and above)
 * @param context 
 */
const isJDK18Available = async (context: vscode.ExtensionContext) => {
    var jdk18exist = false;
    var jdk18Home = undefined;
    var cmd: string | undefined = undefined;
    const workspaceRuntimes:Array<any> | undefined = vscode.workspace.getConfiguration().get('java.configuration.runtimes');
    for (var i = 0; i < workspaceRuntimes!.length; i++) { // iterate, search for 1.8 entry and set project defaults
        const entry = workspaceRuntimes![i];
        if (entry.name.includes('1.8')) { // check for 1.8 entry
            jdk18exist = true;
            jdk18Home = entry.path;
            break;
        }
    }
    if (jdk18Home == undefined) {
        vscode.window.showErrorMessage('No JDK 1.8 home set in settings.json. Click help and see Initial Setup for instructions', 'Help').then((value) => {
            if (value === 'Help') {
                vscode.commands.executeCommand(Commands.SHOW_CORDA_WELCOME);
            }
        });
        return false;
    } else {
        // check that jdk18Home is actually pointing to a jdk18
        const cp = require('child_process');
        // set OS specific cmd
        const platform = process.platform;
        const path = require('path');
        cmd = path.resolve(jdk18Home, './bin/java');
        switch (platform) {
            case 'darwin':
            case 'linux':
                break;
            case 'win32':
                cmd = '"' + cmd + '"'; // add enclosure
                break;
        }
        await cp.exec(cmd + ' -version', (err:any, stdout: any, stderr:any) => {
            console.log(stdout);
            // const isJava18 = stdout.includes('1.8');
            if (!stderr.includes('1.8') && !stdout.includes('1.8')) {
                vscode.window.showErrorMessage('No JDK 1.8 home set in settings.json');
                return false;
            }
        })
        if (platform === 'win32') { // add executable prefix for powershell
            cmd = '& ' + cmd;
        }
    }
    // set bin/java path for workspace TODO - set platform switch here.
    await context.globalState.update('javaExec18', cmd);
    return true;
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

            let x500: {name:string, city: string, country: string} = {
                name: node.name.match("O=(.*),L")![1],
                city: node.name.match("L=(.*),C")![1],
                country: node.name.match("C=(.*)")![1]
            }
    
            // add jarDir to node
            node.jarDir = file.split('build.gradle')[0] + 'build/nodes/' + x500.name;

            let loginRequest: LoginRequest = {
                hostName: hostAndPort[0],
                port: hostAndPort[1],
                username: cred.user,
                password: cred.pass,
                cordappDir: node.jarDir + '/cordapps'
            }
    
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