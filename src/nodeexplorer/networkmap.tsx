import * as React from 'react';
import * as ReactDOM from 'react-dom';
import WorldMapSquare from './WorldMapSquare.png';

const CordaNetwork = (props: {name: string, location: string, address: string}) => {
    return (
        <>
            <img src={WorldMapSquare} alt="World Map" width="100%" />
        </>
    )
}

ReactDOM.render(<CordaNetwork name="" location="" address="" />, document.getElementById('root'));


