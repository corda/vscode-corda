import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { WindowMessage, MessageType, LogEntry } from './types';
import { EntriesDisplay } from "./entriesDisplay";
import { EntriesLoader } from './entriesLoader';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./styles.css";

window.addEventListener("message", event => {
    const message = event.data as WindowMessage;
    switch (message.messageType) {
        case MessageType.NEW_LOG_ENTRIES:
            ReactDOM.render( 
                <div style={{height: 600}}>
                    <EntriesDisplay 
                        filepath={message.filepath} 
                        entriesCount={message.entriesCount} 
                    />
                </div>,
                document.getElementById('root')
            );
            break;
    }
});