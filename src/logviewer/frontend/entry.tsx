import * as React from 'react';
import { LogEntry } from '../backend/types';

export const EntryButton = (props: {entry: LogEntry, key: any}) => {
    const toShow = {
        expanded: {
            content: 
                <ul> 
                    <li> {props.entry.body.message} </li>
                    <li> Spawned at time {props.entry.date.toISOString()} </li>
                    <li> From task {props.entry.source} running on thread {props.entry.thread} </li>
                    <li> Generated info {JSON.stringify(props.entry.body.object)} </li>
                </ul>,
            buttonName: "(hide)"
        } as ComponentsToShow,
        overview: {
            content: <div> {props.entry.severity} </div>,
            buttonName: "(show)"
        } as ComponentsToShow
    };

    const [content, setContent] = React.useState(toShow.overview.content);
    const [showExpanded, setShowExpanded] = React.useState(true);
    const [buttonName, setButtonName] = React.useState(toShow.overview.buttonName);

    const onClick = () => {
        setContent(showExpanded ? toShow.expanded.content : toShow.overview.content);
        setShowExpanded(!showExpanded);
        setButtonName(showExpanded ? toShow.expanded.buttonName : toShow.overview.buttonName);
    }

    return (
        <div key={props.key}>
            <button key={props.key} onClick={onClick}>
                {buttonName}
            </button>
            <br/>
            {content}
        </div>
    )
}

export const LoadingEntry = (props: {key: any}) => (
    <div key= {props.key}>
        . . . . . . . . . .
    </div>
)

interface ComponentsToShow {
    content: JSX.Element
    buttonName: string
}