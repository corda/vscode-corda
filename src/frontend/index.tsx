import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MessageType } from '../backend/types';
import { EntriesLoader } from "./entriesLoader";
import { WelcomeTable } from "./WelcomeTable"

window.addEventListener("message", event => {
    const message = event.data;
    switch (message.messageType) {
        case MessageType.NEW_LOG_ENTRIES:
            ReactDOM.render( 
                <>
                    <WelcomeTable />
                </>,
                document.getElementById('root')
            );
            break;
    }
});

ReactDOM.render(<WelcomeTable/>, document.getElementById('root'));