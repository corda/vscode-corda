import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import CommonViewIndex from './component-view/CommonViewIndex';

const theme = createMuiTheme({
    palette: {
        secondary: {
            main: '#ec1d24'
        } 
    }
})
ReactDOM.render(
    <MuiThemeProvider theme = {theme}><CommonViewIndex viewType={"FlowExplorer"} /> </MuiThemeProvider>
    , 
document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
//serviceWorker.unregister();
