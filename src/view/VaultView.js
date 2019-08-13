import React from 'react';
import logo from './logo.svg';
import SVG from 'react-inlinesvg';
import Axios from 'axios';
import './App.css';

export default class VaultView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            states: []
        }
    }

    componentDidMount() {
        console.log("The component DID mount");
        var _this = this;
        window.setInterval(function() {
            console.log("here is the component mount");
            Axios.get("http://localhost:8080/latestState").then(function (response) {
                console.log(response.data[0]);
                _this.setState({states: response.data})
                //vaultContent = response;
            });
        }, 5000);
    }

    render() {
        return (
            <div className="App">
              <header className="App-header">
                <SVG src={logo} className="App-logo" alt="logo" />
                <p>
                  Editing <code>src/App.js</code> and save to reload.
                </p>
                <a
                  className="App-link"
                  href="https://reactjs.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn React
                </a>
                {this.state.states.map((obj, index) => (
                    <div>
                        {obj}
                    </div>
                ))}
              </header>
            </div>
        );
    }
}