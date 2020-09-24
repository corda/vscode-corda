import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { fileSync } from 'find';
import { v4 as uuidv4 } from 'uuid';

const gjs = require('../gradleParser');

/**
 * Fix which is used for JUnit testrunner to correctly work
 * - may not be necessary if using 'vscode-gradle' must confirm
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
            await context.workspaceState.update("projectIsCorda", true);
        }
    }
    if (!isGradle) await context.workspaceState.update("projectIsCorda", false);
}

/**
 * Entry-point for project level checks and intitial parses
 * @param context 
 */
export const cordaCheckAndLoad = async (context: vscode.ExtensionContext) => {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length < 1) {
		// no active workspace folders, abort
		return 0;
    }

    const projectCwd = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const projectGradle = path.join(projectCwd, '/build.gradle');

    setJDTpref(projectCwd); // inject java testrunner fix setting
    setIsProjectCorda(projectGradle, context); // confirm CordaProject

    if (!context.workspaceState.get("projectIsCorda")) { return false } // EXIT fun

    // No client token set for Corda -> set a new token
    if (context.globalState.get("clientToken") === undefined) {
        await context.globalState.update("clientToken", uuidv4());
    }

    // Parse build.gradle for deployNodes configuration and store to workspace
    let gradleTaskConfigs: cordaTaskConfig[] | undefined = []
    let files = fileSync(/build.gradle$/, projectCwd);
    for(let i = 0; i < files.length; i++){
        gradleTaskConfigs.push(await gjs.parseFile(files[i]));
    }
    let deployNodesConfigs: cordaTaskConfig[] | undefined = gradleTaskConfigs.filter((value) => {
        return value.task && value.task.node;
    })
    // currently allow ONE deployNodesConfig per project but future will allow multiple w/ selection
    await context.workspaceState.update("deployNodesConfig", deployNodesConfigs![0].task);

    return true;
}

// tslint:disable-next-line: class-name
export interface cordaNode {
    name: string,
    notary: [],
    p2pPort: string,
    rpcSettings: any,
    rpcUsers: any,
    cordappDir: string;
}

// tslint:disable-next-line: class-name
export interface cordaNodeConfig {
	[index: number]: { name: string; notary: []; p2pPort: string, rpcSettings : any, rpcUsers : any, cordappDir: string};
}

// tslint:disable-next-line: class-name
export interface cordaNodeDefaultConfig{
	rpcUsers: any;
}

// tslint:disable-next-line: class-name
export interface cordaNodesConfig {
	node: cordaNodeConfig;
	nodeDefaults: cordaNodeDefaultConfig;
}


// tslint:disable-next-line: class-name
interface cordaTaskConfig {
	task: cordaNodesConfig;
}