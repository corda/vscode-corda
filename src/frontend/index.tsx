import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { WindowMessage, MessageType } from '../backend/types';
import { EntriesLoader } from "./entriesLoader";
import { WelcomeTable } from "./WelcomeTable"

window.addEventListener("message", event => {
    const message = event.data as WindowMessage;
    switch (message.messageType) {
        case MessageType.NEW_LOG_ENTRIES:
            ReactDOM.render( 
                <>
                    <WelcomeTable />
                    <EntriesLoader filepath={message.filepath} amountOfEntries={message.amount}/>
                </>,
                document.getElementById('root')
            );
            break;
    }
});

ReactDOM.render(<WelcomeTable/>, document.getElementById('root'));