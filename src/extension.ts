import * as vscode from 'vscode';
import { execSync } from 'child_process';
import { fileSync } from 'find';
import { cwd } from 'process';
import { makeRe } from 'minimatch';
import * as path from 'path';
import { platform } from 'os';

var gjs = [] as any;

if(process.platform.includes("win32") || process.platform.includes("win64")){
	gjs =  require('..\\src\\parser');
}else{
	gjs =  require('../src/parser');
}
var nodeConfig = [] as cordaNodeConfig;
var gradleTerminal = null as any;
var notaryTerminal = null as any;
var partyATerminal = null as any;
var partyBTerminal = null as any;
var partyCTerminal = null as any;
var projectCwd = '';
var terminals = vscode.workspace.getConfiguration().get('terminal') as any;

function loadScript(context: vscode.ExtensionContext, path: string) {
	if(process.platform.includes("win32") || process.platform.includes("win64")){
		path = path.replace(/\//g, "\\");
	}
    return `<script src="${vscode.Uri.file(context.asAbsolutePath(path)).with({ scheme: 'vscode-resource'}).toString()}"></script>`;
}

export function activate(context: vscode.ExtensionContext) {
	console.log('vscode-corda" is now active');

	// monitor workspace folder changes so we can parse the corda gradle config
	context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(e => updateWorkspaceFolders()));

	// and initialize
	updateWorkspaceFolders();

	let cordaClean = vscode.commands.registerCommand('extension.cordaClean', () => {		
		vscode.window.setStatusBarMessage('Running gradlew clean', 4000);
		gradleRun('clean');
	});
	context.subscriptions.push(cordaClean);

	let cordaBuild = vscode.commands.registerCommand('extension.cordaBuild', () => {		
		vscode.window.setStatusBarMessage('Running gradlew build', 4000);
		gradleRun('build');
		console.log(nodeConfig);
	});
	context.subscriptions.push(cordaBuild);

	let cordaTest = vscode.commands.registerCommand('extension.cordaTest', () => {		
		vscode.window.setStatusBarMessage('Running gradlew test', 4000);
		gradleRun('test');
	});
	context.subscriptions.push(cordaTest);

	let cordaDeployNodes = vscode.commands.registerCommand('extension.cordaDeployNodes', () => {		
		vscode.window.setStatusBarMessage('Running gradlew deployNodes', 4000);
		gradleRun('deployNodes');
	});
	context.subscriptions.push(cordaDeployNodes);

	let cordaRunNodes = vscode.commands.registerCommand('extension.cordaRunNodes', () => {		
		vscode.window.setStatusBarMessage('Running gradlew cordaRunNodes', 4000);
		runNodes();
	});
	context.subscriptions.push(cordaRunNodes);

	let cordaShowView = vscode.commands.registerCommand('extension.cordaShowView', () => {
		vscode.window.setStatusBarMessage('Displaying Corda Vault View', 4000);

		// LAUNCH BACKEND
		launchViewBackend();

		const panel = vscode.window.createWebviewPanel('reactView', "Corda Node View", vscode.ViewColumn.Active, {
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [ vscode.Uri.file(path.join(context.extensionPath, 'out')) ]
		});

		panel.webview.html = `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
			</head>
			<body>
				<div id="root"></div>
				${loadScript(context, 'out/vaultview.js')}
			</body>
			</html>
		`;
	});
	context.subscriptions.push(cordaShowView);

	// WINDOWS TEST
	// let launchServer = vscode.commands.registerCommand('extension.launchServer' , () =>{
	// 	launchSpringServer();
	// });
	// context.subscriptions.push(launchServer);

	// let launchClient = vscode.commands.registerCommand('extension.launchClient' , () =>{
	// 	launchSpringClient();
	// });
	// context.subscriptions.push(launchClient);
}

// WINDOWS TEST
// function launchSpringServer(){
// 	var path = terminals.integrated.shell.windows;
// 	var shellArgs = [] as any;
// 	var temppath = "C:\\Users\\Freya Sheer Hardwick\\Documents\\Developer\\IDE\\dev\\vscode-corda";

// 	var cmd = "cd \"" + temppath + "\\server \" && gradlew build && java -jar server\\build\\libs\\server-0.1.0.jar";
// 	let terminal = vscode.window.createTerminal("Server", path, shellArgs);

function launchViewBackend() {

	if (vscode.window.terminals.find((value) => {
		return value.name === "Client Launcher";
	}) === undefined) {
		launchClient();
		console.log("Client Launch successful");
	} else {
		console.log("Client already up");
	}

	if (vscode.window.terminals.find((value) => {
		return value.name === "Server Launcher";
	}) === undefined) {
		launchServer();
		console.log("Server Launch successful");
	} else {
		console.log("Server already up");
	}

}

function launchServer() {
	// TODO - take off hardcoding of Jar path
	var shellArgs = [] as any;
	var cmd = 'cd ' +  '/Users/anthonynixon/Repo/VSCODE/corda_extension/server/server/build/libs && java -jar server-0.1.0.jar';
	let terminal = vscode.window.createTerminal("Server Launcher", 'bash', shellArgs);
	terminal.show(true);
	terminal.sendText(cmd);
	return terminal;
}

// WINDOWS TEST
// function launchSpringClient(){
// 	var path = terminals.integrated.shell.windows;
// 	var shellArgs = [] as any;
// 	var temppath = "C:\\Users\\Freya Sheer Hardwick\\Documents\\Developer\\IDE\\dev\\vscode-corda";

// 	var cmd = "cd \"" + temppath + "\\server \" && gradlew build && java -jar client\\build\\libs\\client-0.1.0.jar localhost:10006 user1 test";
// 	let terminal = vscode.window.createTerminal("Client", path, shellArgs);

function launchClient() {
	// TODO - take off hardcoding of Jar path
	var shellArgs = [] as any;
	var cmd = 'cd ' +  '/Users/anthonynixon/Repo/VSCODE/corda_extension/server/client/build/libs && java -jar client-0.1.0.jar localhost:10006 "user1" "test"';
	let terminal = vscode.window.createTerminal("Client Launcher", 'bash', shellArgs);
	terminal.show(true);
	terminal.sendText(cmd);
	return terminal;
}

function runNode(name : string, port : string, logPort : string) {
	var shellArgs = [] as any;
	var cmd;
	var path;
	//~TODO add jokila port to cmd string / function params
	//bash -c 'cd "/Users/chrischabot/Projects/json-cordapp/workflows-java/build/nodes/PartyB" ; "/Library/Java/JavaVirtualMachines/jdk1.8.0_211.jdk/Contents/Home/jre/bin/java" "-Dcapsule.jvm.args=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5008 -javaagent:drivers/jolokia-jvm-1.6.0-agent.jar=port=7008,logHandlerClass=net.corda.node.JolokiaSlf4jAdapter" "-Dname=PartyB" "-jar" "/Users/chrischabot/Projects/json-cordapp/workflows-java/build/nodes/PartyB/corda.jar" && exit'
	if(terminals.integrated.shell.windows !== null){
		path = terminals.integrated.shell.windows;
		if(path.includes("powershell")){
			cmd = "cd \"" + projectCwd + "\\workflows-java\\build\\nodes\\" + name + "\"; java -Dcapsule:jvm.args=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=" + port + "-javaagent:drivers/jolokia-jvm-1.6.0-agent.jar=port=" + logPort + ",logHandlerClass=net.corda.node.JolokiaSlf4jAdapter -Dname=" + name + " -jar \"" + projectCwd + "\\workflows-java\\build\\nodes\\" + name + "\\corda.jar\"";
		}else{
			cmd = "cd " + projectCwd + "\\workflows-java\\build\\nodes\\" + name + " && java -Dcapsule:jvm.args=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=" + port + "-javaagent:drivers/jolokia-jvm-1.6.0-agent.jar=port=" + logPort + ",logHandlerClass=net.corda.node.JolokiaSlf4jAdapter -Dname=" + name + " -jar \"" + projectCwd + "\\workflows-java\\build\\nodes\\" + name + "\\corda.jar\"";
		}
	}else{
		path = 'bash';
		cmd = 'cd ' + projectCwd + '/workflows-java/build/nodes/' + name + ' && java -Dcapsule.jvm.args=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=' + port + ' -javaagent:drivers/jolokia-jvm-1.6.0-agent.jar=port=' + logPort + ',logHandlerClass=net.corda.node.JolokiaSlf4jAdapter -Dname=' + name + ' -jar ' + projectCwd + '/workflows-java/build/nodes/' + name + '/corda.jar'; // ; exit
	}
	let terminal = vscode.window.createTerminal(name, path, shellArgs);
	terminal.show(true);
	terminal.sendText(cmd);
	return terminal;
}


function runNodes() {
	// TODO use nodeConfig to set see which nodes to run, which ports and all that instead of hard coding
	// TODO: Global boolean for hasRunBuild and hasRunDeploy. If false, build and deploy before we can run nodes
	// (and set deploy false after build, set both false after clean)
	// TODO use global vars to see if terminals are already running, if so kill existing processes/terminals first
	if (notaryTerminal !== null) {
		notaryTerminal.dispose();
		notaryTerminal = null;
	}
	if (partyATerminal !== null) {
		partyATerminal.dispose();
		partyATerminal = null;
	}
	if (partyBTerminal !== null) {
		partyBTerminal.dispose();
		partyBTerminal = null;
	}
	if (partyCTerminal !== null) {
		partyCTerminal.dispose();
		partyCTerminal = null;
	}
	notaryTerminal = runNode('Notary', '5005', '7005');
	partyATerminal = runNode('PartyA', '5006', '7006');
	partyBTerminal = runNode('PartyB', '5007', '7007');
	partyCTerminal = runNode('PartyC', '5008', '7008');
}


function gradleRun(param : string) {
	var path;
	var cmd;
	

	if(terminals.integrated.shell.windows !== null){
		path = terminals.integrated.shell.windows;
		if(path.includes("powershell")){
			cmd = "cd \"" + projectCwd + "\" ; ./gradlew " + param;
		}else{
			cmd = "cd " + projectCwd + " && gradlew " + param;
		}
		 
	}else{
		path = 'bash';
		cmd = 'cd ' + projectCwd + ' && ./gradlew ' + param;
	}
	if (gradleTerminal === null) {
		var shellArgs = [] as any;
		vscode.workspace.getConfiguration().get('terminal');
		gradleTerminal = vscode.window.createTerminal('Gradle', path, shellArgs);
	}
	gradleTerminal.show(true);
	gradleTerminal.sendText(cmd);	
}


function scanGradleFile(fileName : String): any {
	gjs.parseFile(fileName).then(function (representation : cordaTaskConfig) {
		// Pick up any other configuration we might need in this parse loop and assign it to our globals
		if (representation.task !== undefined && representation.task.node !== undefined) {
			nodeConfig = representation.task.node as cordaNodeConfig;
		}
	});
}


function updateWorkspaceFolders(): void {
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length < 1) {
		// no active workspace folders, abort
		return;
	}
	//TODO Only supports one workspace folder for now, add support for multiple (named targets)
	projectCwd = vscode.workspace.workspaceFolders[0].uri.path;
	if(process.platform.includes("win32") || process.platform.includes("win64")){
		projectCwd = projectCwd.replace(/\//g, "\\").slice(1);
	}
	// Search for build.gradle files & scan them for node config's
	let files = fileSync(/build.gradle$/, projectCwd);
	files.forEach(element => {
		scanGradleFile(element);
	});
}


// tslint:disable-next-line: class-name
interface cordaNodeConfig {
	[index: number]: { name: string; notary: []; p2pPort: string, rpcSettings : any, rpcUsers : any};
}

// tslint:disable-next-line: class-name
interface cordaNodesConfig {
	node: cordaNodeConfig;
}

// tslint:disable-next-line: class-name
interface cordaTaskConfig {
	task: cordaNodesConfig;
}

// this method is called when your extension is deactivated
export function deactivate() {
	//TODO close terminals
}
