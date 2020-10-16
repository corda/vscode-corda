import * as vscode from 'vscode';
import * as path from 'path';
import { GlobalStateKeys } from '../types/CONSTANTS';

export const getPrereqsContent = (context: vscode.ExtensionContext, resourceRoot: string) => {
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charSet="utf-8" />
        <title>Corda Extension Home</title>
        <link href='https://fonts.googleapis.com/css?family=Poppins' rel='stylesheet'>
        <style>
            div {
                _border: 1px solid black;
            }
            body {
                font-family: 'Poppins';
                font-size: 22px;
                margin: 0px;
                padding: 0px;
                font-size: 14px;
            }
            h1 {
                font-size: 20px;
            }
            h2 {
                font-size: 18px;
                margin: 0px;
                margin-bottom: 10px;
            }
            .container {
                width: 800px;
                margin: 20px;
            }
            .logo {
                float: right;
                width: 220px;
            }
            .logo svg {
                vertical-align: top;
                width: 200px;
                height: 200px;
            }
            .intro {
                float: left;
                width: 560px;
            }
            .box {
                float: left;
                background-color: var(--vscode-sideBar-background);
                padding: 10px;
                width: 520px;
                margin-top: 20px;
            }
            .footer {
                vertical-align: center;
                clear: both;
                font-size: 12px;
                color: #909090;
            }
        </style>
    </head>
    <body>    
        <div class="container">
            <h1>Corda Open-source blockchain platform for business</h1>
            <div class="intro">
                This extension supports the complete workflow for CorDapp development. Get started, manage your local network, create flows, states and contracts.
            </div>
            <div class="logo">
                <svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#"
                    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg"
                    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 404 385.33334" height="385.33334" width="404"
                    xml:space="preserve" id="svg2" version="1.1">
                    <metadata id="metadata8">
                        <rdf:RDF>
                            <cc:Work rdf:about="">
                                <dc:format>image/svg+xml</dc:format>
                                <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
                                <dc:title></dc:title>
                            </cc:Work>
                        </rdf:RDF>
                    </metadata>
                    <defs id="defs6">
                        <clipPath id="clipPath18" clipPathUnits="userSpaceOnUse">
                            <path id="path16" d="M 0,289 H 303 V 0 H 0 Z" />
                        </clipPath>
                    </defs>
                    <g transform="matrix(1.3333333,0,0,-1.3333333,0,385.33333)" id="g10">
                        <g id="g12">
                            <g clip-path="url(#clipPath18)" id="g14">
                                <g transform="translate(131.2506,173.2166)" id="g20">
                                    <path id="path22" style="fill:#e0241d;fill-opacity:1;fill-rule:nonzero;stroke:none"
                                        d="M 0,0 C 5.787,0 11.17,-1.718 15.679,-4.662 20.85,10.889 30.888,24.206 43.996,33.493 31.566,42.301 16.394,47.494 0,47.494 c -42.09,0 -76.211,-34.12 -76.211,-76.211 0,-42.09 34.121,-76.211 76.211,-76.211 16.394,0 31.566,5.194 43.996,14.002 C 30.888,-81.639 20.85,-68.322 15.679,-52.771 11.17,-55.716 5.787,-57.434 0,-57.434 c -15.86,0 -28.717,12.857 -28.717,28.717 C -28.717,-12.856 -15.86,0 0,0" />
                                </g>
                                <g transform="translate(219.2432,173.2171)" id="g24">
                                    <path id="path26" style="fill:#e0241d;fill-opacity:1;fill-rule:nonzero;stroke:none"
                                        d="m 0,0 c -15.86,0 -28.717,-12.857 -28.717,-28.717 0,-15.86 12.857,-28.717 28.717,-28.717 15.86,0 28.717,12.857 28.717,28.717 C 28.717,-12.857 15.86,0 0,0" />
                                </g>
                            </g>
                        </g>
                    </g>
                </svg>
            </div>
            ${
                context.globalState.get(GlobalStateKeys.IS_ENV_CORDA_NET) ? '' : 
                `<div class="box">
                <h2>Initital Setup</h2>
                <p>Running the Corda extension requires <b>both</b> JDK 11 and JDK 1.8 installed on your system.</p>
                <p>
                The Java features in VSCode require a Java 11. A path is searched in the following order:
                <ul>
                  <li>the java.home setting in VS Code settings (workspace then user settings)</li>
                  <li>the JDK_HOME environment variable</li>
                  <li>the JAVA_HOME environment variable</li>
                  <li>on the current system path</li>
                </ul>
                
                In addition, JDK 1.8 must be configured in the VSCode User Settings. 
                <ol>
                  <li>Choose 'Preferences -> Settings' from the VSCode menu and then search for the following entry <b>java.configuration.runtimes</b></li>
                  <li>Click 'edit in settings.json'</li>
                  <li>Add your <b>JDK 1.8</b> path to the following entries. Below are filled in examples:</li>
                </ol>
                <p>
                <b>OS X / Linux:</b>
              </p>
              <div style="font-size:9pt">
              <pre><code>"java.import.gradle.java.home": "/usr/lib/jvm/java-8-openjdk-amd64", 
"java.configuration.runtimes": [
{
    "name": "JavaSE-1.8",
    "path": "/usr/lib/jvm/java-8-openjdk-amd64"
}
],
              </code></pre>
              </div>
              <p>
                <b>Windows:</b>
              </p>
              <div style="font-size:9pt">
              <pre><code>"java.import.gradle.java.home": "C:\\Program Files\\Java\\jdk1.8.0_261",
"java.configuration.runtimes": [
{
    "name": "JavaSE-1.8",
    "path": "C:\\Program Files\\Java\\jdk1.8.0_261"
}
],
                </code>
              </pre>
              </div>
              * Make sure to change the 'path' with your own JDK 1.8 home path.
                </p>
            </div>`
            }
            
            <div class="box">
                <h2>Using the extension</h2>
                <p>The Corda extension will be activated whenever you open a CorApp project in code.</p>
                <p>Click the Corda icon in the left navigation bar to get to the application lifecycle actions, and to browse your flows, states, and contracts.</p>
            </div>
            <div class="box">
                <h2>Training and documentation</h2>
                <p><a href="https://docs.corda.net/docs/corda-os/" target="_blank">Corda Documentation</a></p>
                <p><a href="https://training.corda.net" target="_blank">Corda Training</a></p>
            </div>
            <div class="footer">
                <br>
                Corda Visual Studio Extension by <a target="_blank" href="https://www.r3.com">R3</a> | 
                <a target="_blank" href="https://github.com/corda/vscode-corda">Project Repository</a>
            </div>
        </div>
    </body>
    </html>`
}


const loadLogo = (context: vscode.ExtensionContext, resourceRoot: string, file: string) => {
    const fullPath = context.asAbsolutePath(path.normalize(resourceRoot) + file);
    return `
    <img src="${vscode.Uri.file(fullPath).with({scheme: 'vscode-resource'}).toString()}" > </img>
    `
}


