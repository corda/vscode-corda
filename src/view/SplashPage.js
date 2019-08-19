import React from 'react';
import './component-style/SplashPage.css';
import logo from './resources/corda.svg';
import SVG from 'react-inlinesvg'

import CardCarousel from './component-view/CardCarousel'

export default class VaultView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
        }
        console.log(window.location.pathname);
    }

    componentDidMount() {
        
    }

    render() {
        return (
            <div className="App">
                <SVG src={logo} style={{height: 50 + 'vh'}}/>
                <CardCarousel />
            </div>
        );
    }
}