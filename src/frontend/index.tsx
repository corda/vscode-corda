import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MessageType } from "../backend/types";
import { SimpleTable } from "./SimpleTable";

window.addEventListener("message", event => {
    ReactDOM.render(
        (<p> Message received and understood !!</p>), 
        document.getElementById("root"));
    const message = event.data;
    switch (message.messageType) {
        case MessageType.NEW_LOG_ENTRIES:
            ReactDOM.render(SimpleTable(message.payload), document.getElementById('root'));
            break;
    }
});
ReactDOM.render(<div> hi! </div>, document.getElementById('root'));