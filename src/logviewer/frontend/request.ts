import * as vscode from 'vscode';

export const launchClient = () => {
    const termName = "Node Client Server";
    if (findTerminal(termName) === undefined) {
        const terminal = vscode.window.createTerminal(termName);
        const jarPath = vscode.extensions.getExtension("R3.vscode-corda")?.extensionPath;
        terminal.sendText(`cd ${jarPath}`);
        terminal.sendText(`java -jar explorer-server-0.1.0.jar --servertoken=${"hiiiii!"}`);
        console.log("Client launched successfully!");
    } 
    else {
        console.log("Client already up")
    }
}

const findTerminal = (termName: string) => {
	const terminals = vscode.window.terminals.filter(t => t.name == termName);
	return terminals.length !== 0 ? terminals[0] : undefined;
}