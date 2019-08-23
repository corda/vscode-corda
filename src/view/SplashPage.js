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
        this.toggleToNodeExplorer = this.toggleToNodeExplorer.bind(this);
        this.toggleToNodeViewer = this.toggleToNodeViewer.bind(this);

        console.log(window.location.pathname);
    }

    toggleToNodeExplorer(client){
        this.setState({
            displayNodeViewer: false,
            displayNodeExplorer: true,
            client: client
        })
    }

    toggleToNodeViewer(){
        console.log("I am supposedly doing something")
        this.setState({
            displayNodeExplorer: false,
            displayNodeViewer: true

        })
    }

    componentDidMount() {
        
    }

    render() {
        //<SVG src={logo} style={{height: 50 + 'vh'}}/>
        let Display = null;
        if(this.state.displayNodeViewer){
            Display = <div className="node-view-port"> <NodeViewer toggleToNodeExplorer = {this.toggleToNodeExplorer} /> </div>
        }else if(this.state.displayNodeExplorer){
            Display = <NodeExplorer client = {this.state.client} toggleToNodeViewer = {this.toggleToNodeViewer}/>

        }
        return (
            <div className="App">
               
                {Display}
            </div>
        );
    }
}