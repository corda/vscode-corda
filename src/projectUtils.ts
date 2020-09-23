import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { fileSync } from 'find';
import { v4 as uuidv4 } from 'uuid';
import gjs from './gradleParser';

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
 * TODO: Stronger check, should check minimal required corda dependencies and throw relevant error. 
 * current check is merely against the 'corda' keyword.
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

    // let files = fileSync(/build.gradle$/, projectCwd);
    // for(let i = 0; i < files.length; i++){
    //     scanGradleFile(files[i], i === files.length - 1);
    // }
    
    // console.log("stop");

    return true;
}

/**
 * scanGradleFile uses the imported parser to scan through a passed in file. 
 * If it detects that the parse has returned attributes that we'd expect in the gradle file that defines the nodes, 
 * it will load the contents of that file into the nodeConfig variable (which will then be used to 
 * pass connection information up to the views).
 * @param fileName - location of the file to parse
 * @param last - boolean that indicates whether this is the last file that needs to be scanned
 */
const scanGradleFile = (fileName : String, last: boolean): any => {
    // TEMP VARS
    let nodeDefaults: cordaNodeDefaultConfig[] | any = []
    let nodeConfig: cordaNodeConfig;
    let nodeDir: any;
    let nodeNames: any;

	gjs.parseFile(fileName).then((representation : cordaTaskConfig) => {
		// Pick up any other configuration we might need in this parse loop and assign it to our globals
		if (representation.task !== undefined && representation.task.node !== undefined) {
			if(representation.task.nodeDefaults){
				nodeDefaults = representation.task.nodeDefaults as cordaNodeDefaultConfig;
			}else{
				nodeDefaults = {rpcUsers : {} };
			}
			nodeConfig = representation.task.node as cordaNodeConfig;
			nodeDir = fileName.replace('build.gradle','');
		}
		
		if(last){
			// reset nodeNames
			nodeNames = [] as any;
			for(let index in nodeConfig) {
				nodeNames.push(nodeConfig[index].name.match("O=(.*),L")![1]);
			}
			console.log('Node names in build.gradle are: ' + JSON.stringify(nodeNames));
		}
	});
}
   
// tslint:disable-next-line: class-name
interface cordaNodeConfig {
	[index: number]: { name: string; notary: []; p2pPort: string, rpcSettings : any, rpcUsers : any, cordappDir: string};
}

// tslint:disable-next-line: class-name
interface cordaNodeDefaultConfig{
	rpcUsers: any;
}

// tslint:disable-next-line: class-name
interface cordaNodesConfig {
	node: cordaNodeConfig;
	nodeDefaults: cordaNodeDefaultConfig;
}


// tslint:disable-next-line: class-name
interface cordaTaskConfig {
	task: cordaNodesConfig;
}