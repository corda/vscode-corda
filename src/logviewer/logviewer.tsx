import React, { Component, useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom';
import "./logviewer.css";
import LogViewerComponent from './LogViewerComponent';
import { WindowMessage, MessageType } from './types';
import axios from "axios";

export const SERVER_BASE_URL = window.location.href.startsWith("https") ? "/proxy/8580" : "http://localhost:8580";

interface LogData {
    entries: Number,
    filepath: string
}

const App = () => {
    const [logData, setLogData] = useState<LogData>();

    const countEntries = async (filepath) => {
        const path = directoriesIn(filepath);
        const postRequest = {
            components: path
        }
        const result = await axios.post(SERVER_BASE_URL + '/logReader/entriesCount', postRequest);
        return result.data.data.entriesCount;
    }
    const directoriesIn = (filepath) => filepath.replace(/\\/g, "/").split("/");

    const receiveLogData = (event) => {
        const message = event.data as WindowMessage;
        countEntries(message.filepath).then(entries => {
            setLogData({
                entries: entries,
                filepath: message.filepath
            })
        })
    }

    useEffect(() => {
        window.addEventListener('message', receiveLogData);
        return () => {
            window.removeEventListener('message', receiveLogData);
        }
    },[])

    return (
        <div style={{height: 600}}>
        {logData ?  <LogViewerComponent entries={logData.entries} filepath={logData.filepath} /> : 
        `Loading...`
        }
        </div>
    )
}

ReactDOM.render(
    <App />,
    document.getElementById('root')
);