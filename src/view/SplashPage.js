import React from 'react';
import './component-style/SplashPage.css';
import logo from './resources/corda.svg';
import SVG from 'react-inlinesvg'

import CardCarousel from './component-view/CardCarousel'
import NodeViewer from './component-view/NodeViewer'
import NodeExplorer from './component-view/NodeExplorer'

export default class VaultView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            displayNodeViewer: true,
            displayNodeExplorer: false
        }
        this.toggleNodeView = this.toggleNodeView.bind(this);
        console.log(window.location.pathname);
    }

    toggleNodeView(){
        this.setState({
            displayNodeViewer: false,
            displayNodeExplorer: true
        })
    }

    componentDidMount() {
        
    }

    render() {
        //<SVG src={logo} style={{height: 50 + 'vh'}}/>
        let Display = null;
        if(this.state.displayNodeViewer){
            Display = <NodeViewer toggleNodeView = {this.toggleNodeView} />
        }else if(this.state.displayNodeExplorer){
            Display = <NodeExplorer />
        }
        return (
            <div className="App">
               
                {Display}
            </div>
        );
    }
}