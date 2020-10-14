import * as React from 'react';
import * as ReactDOM from 'react-dom';
import "./index.css";
import LogViewer from './LogViewer';
import { WindowMessage, MessageType } from './types';
import axios from "axios";


window.addEventListener("message", (event) => {
    const message = event.data as WindowMessage;
    switch (message.messageType) {
        case MessageType.NEW_LOG_ENTRIES:
            countEntries(message.filepath).then((res) => {
                console.log(res);
                ReactDOM.render( 
                    <div style={{height: 600}}>
                        <LogViewer 
                            entries={res}
                            filepath={message.filepath}  
                        />
                    </div>,
                    document.getElementById('root')
                );
            })
            // const logData = await getData(message.filepath)
            console.log(message.filepath);
            break;
    }
});

const countEntries = async (filepath) => {
    const path = directoriesIn(filepath);
    const postRequest = {
        components: path
    }
    const result = await axios.post(`http://localhost:8580/logReader/entriesCount`, postRequest);
    return result.data.data.entriesCount;
}

const directoriesIn = (filepath) => filepath.replace(/\\/g, "/").split("/");
