import * as vscode from 'vscode';
import { areNodesDeployed } from '../projectUtils';
import { runGradleTaskCallback } from './general';

/**
 * Deploys nodes in project with pre-req checking
 * @param context 
 */
export const deployNodesCallBack = async (context: vscode.ExtensionContext) => {
    const userConf = async () => { // confirm with user and decide whether to deploy nodes.
        let shouldDeploy = true;
        if (await areNodesDeployed(context)) {
            await vscode.window.showInformationMessage("Network is already deployed. Re-deploy will reset node data.", 'Run Network', 'Re-deploy', 'Cancel')
                .then((selection) => {
                    switch (selection) {
                        case 'Run Network':
                            // RUN TASK
                            vscode.commands.executeCommand('corda.mockNetwork.runNodes');
                            shouldDeploy = false; // quit the command
                            break;
                        case 'Re-deploy':
                            shouldDeploy = true;
                            break;
                        default:
                            shouldDeploy = false; // quit the command
                    }
                })
        }
        return shouldDeploy;
    }
    await userConf().then((deployNodes) => {
        if (!deployNodes) return;
        runGradleTaskCallback("deployNodes").then(async () => {
            await areNodesDeployed(context); // double check in case of interruption of task
        });
    })
}
