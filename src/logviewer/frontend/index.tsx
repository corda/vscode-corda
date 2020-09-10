import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { WindowMessage, MessageType, LogEntry } from './types';
import { EntriesDisplay } from "./entriesDisplay";

window.addEventListener("message", event => {
    const message = event.data as WindowMessage;
    switch (message.messageType) {
        case MessageType.NEW_LOG_ENTRIES:
            ReactDOM.render( 
                <div style={{height: 600}}>
                    <EntriesDisplay 
                        filepath={message.filepath} 
                        amountOfEntries={message.entriesCount} 
                    />
                </div>,
                document.getElementById('root')
            );
            break;
    }
});