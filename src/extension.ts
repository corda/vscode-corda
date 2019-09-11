import * as vscode from 'vscode';
import { fileSync } from 'find';
import * as path from 'path';


var gjs = [] as any;


if(process.platform.includes("win32") || process.platform.includes("win64")){
	gjs =  require('..\\src\\parser');
}else{
	gjs =  require('../src/parser');
}
var nodeConfig = [] as cordaNodeConfig;
var nodeDefaults: cordaNodeDefaultConfig;
var nodeDir = ''; // holds dir of build.gradle for referencing relative node dir
var validNodes = [] as any; // names of valid nodes for referencing relative node dir
var nodeCordappDir = new Map(); // cordapp dir for each node
var hasRunBuild = false;
var hasRunDeploy = false;
var openTerminals = [] as any;
var nodeLoaded = false;
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
	vscode.window.setStatusBarMessage('Loading nodes from gradle', 4000);
	updateWorkspaceFolders();
	console.log("loaded?");
	console.log(nodeLoaded);

	let cordaClean = vscode.commands.registerCommand('extension.cordaClean', () => {		
		vscode.window.setStatusBarMessage('Running gradlew clean', 4000);
		gradleRun('clean');
	});
	context.subscriptions.push(cordaClean);

	let cordaBuild = vscode.commands.registerCommand('extension.cordaBuild', () => {		
		vscode.window.setStatusBarMessage('Running gradlew build', 4000);
		gradleRun('build');
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

	let cordaShowVaultQuery = vscode.commands.registerCommand('extension.cordaShowVaultQuery', () =>{
		vscode.window.setStatusBarMessage('Displaying Corda Vault Query View', 5000);
		var viewIsLaunched = false;
		for (var i = 0; i < 10; i++) {
			(function (i) {
			  setTimeout(function () {
				if(nodeLoaded){
					if(!viewIsLaunched){
						viewIsLaunched = true;
						launchView(context, "vaultQuery");
					}
				}
			  }, 3000*i);
			})(i);
		  }
		
	

	});
	context.subscriptions.push(cordaShowVaultQuery);

	let cordaShowView = vscode.commands.registerCommand('extension.cordaShowTransactionExplorer', () => {
		vscode.window.setStatusBarMessage('Displaying Corda Transaction Explorer', 5000);
		var viewIsLaunched = false;
		for (var i = 0; i < 10; i++) {
			(function (i) {
			  setTimeout(function () {
				if(nodeLoaded){
					if(!viewIsLaunched){
						viewIsLaunched = true;
						launchView(context, "transactionExplorer");
					}
				}
			  }, 3000*i);
			})(i);
		  }
		
		
		
		
	});
	
	context.subscriptions.push(cordaShowView);


	
	
}

function launchView(context: any, view: string){
	// LAUNCH BACKEND
	launchViewBackend();

	const panel = vscode.window.createWebviewPanel('reactView', "Corda View " + view, vscode.ViewColumn.Active, {
		enableScripts: true,
		retainContextWhenHidden: true,
		localResourceRoots: [ vscode.Uri.file(path.join(context.extensionPath, 'out')) ]
	});

	var locationOfView; 
	if(process.platform.includes("win32") || process.platform.includes("win64")){
		locationOfView =  'out\\' + view + '.js';
	}else{
		locationOfView =  'out/' + view + '.js';
	}

	//console.log("Node config has " + JSON.stringify(nodeConfig) );
	// console.log(nodeConfig[0]);


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
			<div id="nodeDefaults" style="display:none">${JSON.stringify(nodeDefaults)}</div>
			<div id="nodeList" style="display:none">${JSON.stringify(nodeConfig)}</div>
			<div id="root"></div>
			${loadScript(context,locationOfView)}
		</body>
		</html>
	`;
}

function launchViewBackend() {

	// update cordapp dirs on nodes in node config
	for (var index in nodeConfig) {
		var name = nodeConfig[index].name.match("O=(.*),L")![1];
		nodeConfig[index].cordappDir = nodeDir + "build/nodes/" + name + "/cordapps";
		validNodes[index] = name;
	}

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
	var shellArgs = [] as any;
	var cmd = "";
	var path;
	var jarDir;
	var ext = vscode.extensions.getExtension("R3.vscode-corda");
    if (ext !== undefined) {
		jarDir = ext.extensionPath;
     }
	if(jarDir !== undefined){
		if(terminals.integrated.shell.windows !== null){
			if(process.platform.includes("win32") || process.platform.includes("win64")){
				jarDir = jarDir.replace(/\//g, "\\");
			}
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


function scanGradleFile(fileName : String, last: boolean): any {
	
	gjs.parseFile(fileName).then(function (representation : cordaTaskConfig) {
		// Pick up any other configuration we might need in this parse loop and assign it to our globals
		console.log(representation);
		if (representation.task !== undefined && representation.task.node !== undefined) {
			if(representation.task.nodeDefaults){
				nodeDefaults = representation.task.nodeDefaults as cordaNodeDefaultConfig;
			}
			nodeConfig = representation.task.node as cordaNodeConfig;
			nodeDir = fileName.replace('build.gradle','');
			console.log(nodeConfig);
		}
		
		if(last){
			nodeLoaded = true;
		}
	});
}

function updateWorkspaceFolders(): any {
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length < 1) {
		// no active workspace folders, abort
		return 0;
	}
	//TODO Only supports one workspace folder for now, add support for multiple (named targets)
	projectCwd = vscode.workspace.workspaceFolders[0].uri.path;
	if(process.platform.includes("win32") || process.platform.includes("win64")){
		projectCwd = projectCwd.replace(/\//g, "\\").slice(1);
	}
	// Search for build.gradle files & scan them for node config's
	let files = fileSync(/build.gradle$/, projectCwd);
	
	for(var i = 0; i < files.length; i++){
		scanGradleFile(files[i], i === files.length - 1);
	}
	// files.forEach(element => {
	// 	scanGradleFile(element);
	// });
}

// async function asyncForEach(array: any, callback: any) {
// 	for (let index = 0; index < array.length; index++) {
// 	  await callback(array[index], index, array);
// 	}
// 	return Promise.resolve();
//   }
  
   
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

// this method is called when your extension is deactivated
export function deactivate() {
	//TODO close terminals
}
