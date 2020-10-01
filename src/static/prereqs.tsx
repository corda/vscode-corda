import * as vscode from 'vscode';
import * as path from 'path';

export const getPrereqsContent = (context: vscode.ExtensionContext, resourceRoot: string) => {
    return `<!DOCTYPE html>
    <html lang="en"> 
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Prerequisites</title>
    </head>
    <body>
        <table border="0">
        <tr>
        <td><img src="https://raw.githubusercontent.com/corda/vscode-corda/v0.2.0_views/assets/crda-logo.svg" alt="" width="182" height="182" /><span style="font-size: 36pt; margin :0 0 0 75px;"></td>
        </tr>
        </table>
        <p></p>
        <p><span style="font-family: arial, helvetica, sans-serif; font-size: 16px;">CorDapps (Corda Distributed Applications) are distributed applications that run on the Corda platform. The goal of a CorDapp is to allow nodes to reach agreement on updates to the ledger.</span></p>
        <hr />
        <h3>Let's make sure you're setup correctly...</h3>
        <p></p>
        <p>Prerequisites:</p>
        <table border="1" style="border-collapse: collapse; width: 100%;">
        <tbody>
        <tr>
        <td style="width: 32.7968%;">Name</td>
        <td style="width: 33.5461%;">Version</td>
        <td style="width: 33.6571%;">Status</td>
        </tr>
        </tbody>
        </table>
        <table border="0" style="width: 100%; border-collapse: collapse;">
        <tbody>
        <tr>
        <td style="width: 33.0189%;"></td>
        <td style="width: 33.4905%;"></td>
        <td style="width: 33.4905%;"></td>
        </tr>
        <tr>
        <td style="width: 33.0189%;">Java OpenJDK 11</td>
        <td style="width: 33.4905%;">11.0.8</td>
        <td style="width: 33.4905%;">installed</td>
        </tr>
        <tr>
        <td style="width: 33.0189%;">Java OpenJDK 8</td>
        <td style="width: 33.4905%;">1.8.0.261</td>
        <td style="width: 33.4905%;">installed</td>
        </tr>
        <tr>
        <td style="width: 33.0189%;">Java Language Support Extension</td>
        <td style="width: 33.4905%;">0.68.0</td>
        <td style="width: 33.4905%;">installed</td>
        </tr>
        <tr>
        <td style="width: 33.0189%;">Java Debugger Extension</td>
        <td style="width: 33.4905%;">0.28.0</td>
        <td style="width: 33.4905%;">installed</td>
        </tr>
        <tr>
        <td style="width: 33.0189%;">Java Test Runner Extension</td>
        <td style="width: 33.4905%;">0.24.2</td>
        <td style="width: 33.4905%;">installed</td>
        </tr>
        <tr>
        <td style="width: 33.0189%;">Gradle Tasks Extension</td>
        <td style="width: 33.4905%;">3.4.5</td>
        <td style="width: 33.4905%;">installed</td>
        </tr>
        </tbody>
        </table>
        <p>&nbsp;</p>
        <p></p>
        <p></p>
    </body>
    </html>`
}


const loadLogo = (context: vscode.ExtensionContext, resourceRoot: string, file: string) => {
    const fullPath = context.asAbsolutePath(path.normalize(resourceRoot) + file);
    return `
    <img src="${vscode.Uri.file(fullPath).with({scheme: 'vscode-resource'}).toString()}" > </img>
    `
}


