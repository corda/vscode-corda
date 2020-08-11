import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MessageType } from "../backend/types";
import { BlancasTable } from "./App1";
import TableExample from "./Table";

window.addEventListener("message", event => {
    const message = event.data;
    switch (message.messageType) {
        case MessageType.NEW_LOG_ENTRIES:
            ReactDOM.render(
                <BlancasTable logentries={message.payload} />, 
                document.getElementById('root')
            );
            break;
    }
});
ReactDOM.render(<div> hi! </div>, document.getElementById('root'));