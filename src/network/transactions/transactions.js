import React, {Component} from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import ReduxToastr from 'react-redux-toastr'
import { applyMiddleware, createStore, combineReducers } from 'redux';
import {reducer as toastrReducer} from 'react-redux-toastr';
import thunk from 'redux-thunk';
import txReducer from './txExplorerReducer';
import TransactionExplorer from './txExplorerComponent';
import { composeWithDevTools } from 'redux-devtools-extension';
import '../styles/index.css';
import 'react-redux-toastr/lib/css/react-redux-toastr.min.css'

const rootReducer = combineReducers({
    trnx: txReducer,
    toastr: toastrReducer
});

const store = createStore(rootReducer, composeWithDevTools(applyMiddleware(thunk)));

ReactDOM.render(<Provider store={store}>
    <div style={{height: "100%"}}>
        <TransactionExplorer />
        <ReduxToastr
            timeOut={3000}
            newestOnTop={false}
            preventDuplicates
            position="top-right"
            getState={(state) => state.toastr}
            transitionIn="fadeIn"
            transitionOut="fadeOut"
            progressBar
            s
            closeOnToastrClick/>
    </div>
    </Provider>, 
    document.getElementById('root')
);
