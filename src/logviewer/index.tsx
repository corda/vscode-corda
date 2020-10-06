import * as React from 'react';
import * as ReactDOM from 'react-dom';
import "./index.css";
import LogViewer from './LogViewer';
import { WindowMessage, MessageType } from './types';

// Temporary static data for demo

window.addEventListener("message", event => {
    const message = event.data as WindowMessage;
    switch (message.messageType) {
        case MessageType.NEW_LOG_ENTRIES:
            ReactDOM.render( 
                <div style={{height: 600}}>
                    <LogViewer 
                        filepath={message.filepath}  
                    />
                </div>,
                document.getElementById('root')
            );
            break;
    }
});