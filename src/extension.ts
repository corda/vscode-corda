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
var nodeDir = ''; // holds dir of build.gradle for referencing relative node dir
var validNodes = [] as any; // names of valid nodes for referencing relative node dir
var hasRunBuild = false;
var hasRunDeploy = false;
var openTerminals = [] as any;

var gradleTerminal = null as any;

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

		var locationOfView; 
		if(process.platform.includes("win32") || process.platform.includes("win64")){
			locationOfView =  'out\\vaultview.js';
		}else{
			locationOfView =  'out/vaultview.js';
		}

		panel.webview.html = `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
				<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
				
				<script defer src="https://use.fontawesome.com/releases/v5.0.6/js/all.js"></script>
			</head>
			<body>
				<div id="nodeList" style="display:none">${JSON.stringify(nodeConfig)}</div>
 
				<div id="root"></div>
				${loadScript(context,locationOfView)}
			</body>
			</html>
		`;
	});
	context.subscriptions.push(cordaShowView);
}

function launchViewBackend() {

	if (vscode.window.terminals.find((value) => {
		return value.name === "Client Launcher";
	}) === undefined) {
		launchClient();
		console.log("Client Launch successful");
	} else {
		console.log("Client already up");
	}
}

function launchClient() {
	// TODO - take off hardcoding of Jar path
	var shellArgs = [] as any;
	var cmd;
	var path;
	var jarDir = process.cwd(); // extension directory
	
	if(terminals.integrated.shell.windows !== null){
		path = terminals.integrated.shell.windows;
		if(path.includes("powershell")){
			cmd = "cd \"" + jarDir + "\\src\"; java -jar client-0.1.0.jar"; 
		}else{
			cmd = "cd " + jarDir + "\\src  && java -jar client-0.1.0.jar";
		}
	}else{
		path = 'bash';
		cmd = 'cd ' + jarDir + '/src && java -jar client-0.1.0.jar';
	}
	let terminal = vscode.window.createTerminal("Client Launcher", path, shellArgs);
	terminal.show(true);
	terminal.sendText(cmd);
	return terminal;
}

function runNode(name : string, port : string, logPort : string) {
	var shellArgs = [] as any;
	var cmd;
	var path;

	// store cordapp dirs for each node launch

	//~TODO add jokila port to cmd string / function params
	if(terminals.integrated.shell.windows !== null){
		path = terminals.integrated.shell.windows;
		if(path.includes("powershell")){
			cmd = "cd \"" + nodeDir + "build\\nodes\\" + name + "\"; java -Dcapsule:jvm.args=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=" + port + "-javaagent:drivers/jolokia-jvm-1.6.0-agent.jar=port=" + logPort + ",logHandlerClass=net.corda.node.JolokiaSlf4jAdapter -Dname=" + name + " -jar \"" + projectCwd + "\\workflows-java\\build\\nodes\\" + name + "\\corda.jar\"";
		}else{
			cmd = "cd " + nodeDir + "build\\nodes\\" + name + " && java -Dcapsule:jvm.args=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=" + port + "-javaagent:drivers/jolokia-jvm-1.6.0-agent.jar=port=" + logPort + ",logHandlerClass=net.corda.node.JolokiaSlf4jAdapter -Dname=" + name + " -jar \"" + projectCwd + "\\workflows-java\\build\\nodes\\" + name + "\\corda.jar\"";
		}
	}else{
		path = 'bash';
		cmd = 'cd ' + nodeDir + 'build/nodes/' + name + ' && java -Dcapsule.jvm.args=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=' + port + ' -javaagent:drivers/jolokia-jvm-1.6.0-agent.jar=port=' + logPort + ',logHandlerClass=net.corda.node.JolokiaSlf4jAdapter -Dname=' + name + ' -jar ' + projectCwd + '/workflows-java/build/nodes/' + name + '/corda.jar'; // ; exit
	}
	let terminal = vscode.window.createTerminal(name, path, shellArgs);
	terminal.show(true);
	terminal.sendText(cmd);
	return terminal;
}


function runNodes() {
	// DONE use nodeConfig to set see which nodes to run, which ports and all that instead of hard coding
	// TODO: Global boolean for hasRunBuild and hasRunDeploy. If false, build and deploy before we can run nodes
	// (and set deploy false after build, set both false after clean)
	// DONE use global vars to see if terminals are already running, if so kill existing processes/terminals first
	
	var port = 5005;
	var logPort = 7005;

	// dispose if terminals exist
	for (var j = 0; j < openTerminals.length; j++) {
		openTerminals[j].dispose();
		openTerminals[j] = null;
	}

	// push new terminals
	for (var i = 0; i < validNodes.length; i++) {
		openTerminals.push(runNode(validNodes[i], (port++).toString(), (logPort++).toString()));
	}
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
		
		nodeDir = fileName.replace('build.gradle','');

		// fast non-iterative conversion from to array
		var nodes = JSON.stringify(nodeConfig);
		var pnodes = JSON.parse(nodes);
		
		for (var i = 0; i < pnodes.length; i++) {
			validNodes[i] = pnodes[i]["name"].match("O=(.*),L")[1];
		}

		console.log(validNodes);
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
