import * as vscode from 'vscode';
import { execSync } from 'child_process';
import { fileSync } from 'find';
import { cwd } from 'process';
import { makeRe } from 'minimatch';

var gjs = require('/Users/chrischabot/Projects/vscode-corda/src/parser');

var nodeConfig = [] as cordaNodeConfig;
var gradleTerminal = null as any;
var notaryTerminal = null as any;
var partyATerminal = null as any;
var partyBTerminal = null as any;
var partyCTerminal = null as any;
var projectCwd = '';


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
}


function runNode(name : string, port : string, logPort : string) {
	var shellArgs = [] as any;
	//~TODO add jokila port to cmd string / function params
	var cmd = 'cd ' + projectCwd + '/workflows-java/build/nodes/' + name + ' && java -Dcapsule.jvm.args=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=' + port + ' -javaagent:drivers/jolokia-jvm-1.6.0-agent.jar=port=' + logPort + ',logHandlerClass=net.corda.node.JolokiaSlf4jAdapter -Dname=' + name + ' -jar ' + projectCwd + '/workflows-java/build/nodes/' + name + '/corda.jar ; exit';
	let terminal = vscode.window.createTerminal(name, 'bash', shellArgs);
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
	notaryTerminal = runNode('Notary', '10000', '7005');
	partyATerminal = runNode('PartyA', '10004', '7006');
	partyBTerminal = runNode('PartyB', '10008', '7007');
	partyCTerminal = runNode('PartyC', '10012', '7008');
}


function gradleRun(param : string) {
	if (gradleTerminal === null) {
		var shellArgs = [] as any;
		gradleTerminal = vscode.window.createTerminal('Gradle', 'bash', shellArgs);
	}
	gradleTerminal.show(true);
	gradleTerminal.sendText('cd ' + projectCwd + ' && ./gradlew ' + param);
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

	// Search for build.gradle files & scan them for node config's
	let files = fileSync(/build.gradle$/, projectCwd);
	files.forEach(element => {
		scanGradleFile(element);
	});
}


// tslint:disable-next-line: class-name
interface cordaNodeConfig {
	[index: number]: { name: string; notary: []; p2pPort: string, rpcSettings : Object, rpcUsers : []};
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
