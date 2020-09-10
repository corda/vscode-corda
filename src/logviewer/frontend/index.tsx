import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { WindowMessage, MessageType, LogEntry } from '../backend/types';
import { EntriesLoader } from "./entriesLoader";

window.addEventListener("message", event => {
    const message = event.data as WindowMessage;
    switch (message.messageType) {
        case MessageType.NEW_LOG_ENTRIES:
            ReactDOM.render( 
                <div style={{height: 600}}>
                    <EntriesLoader 
                        filepath={message.filepath} 
                        amountOfEntries={message.amount} 
                        filterBy={(entry: LogEntry) => !entry.body.message.includes("check")}
                    />
                </div>,
                document.getElementById('root')
            );
            break;
    }
});