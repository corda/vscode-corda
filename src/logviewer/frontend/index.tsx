import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { WindowMessage, MessageType } from '../backend/types';
import { EntriesLoader } from "./entriesLoader";
import { Filterer } from "./filterer";

window.addEventListener("message", event => {
    const message = event.data as WindowMessage;
    switch (message.messageType) {
        case MessageType.NEW_LOG_ENTRIES:
            ReactDOM.render( 
                <div style={{height: 600}}>
                    <Filterer filterBy={"e"} />
                    <EntriesLoader filepath={message.filepath} amountOfEntries={message.amount} />
                </div>,
                document.getElementById('root')
            );
            break;
    }
});