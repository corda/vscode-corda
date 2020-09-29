import React, { Component } from 'react';
import * as ReactDOM from 'react-dom';

declare var acquireVsCodeApi: any;

const testAPI = () => {
    const vscode = acquireVsCodeApi();
    vscode.postMessage({
        command: 'alert',
        text: 'This is a test message from webview'
    })
}

ReactDOM.render(
    <>
    Transactions View
    {testAPI()}
    </>, 
    document.getElementById('root')
);