import React from 'react';
import '../component-style/StateHoverCard.css';
export default class StateHoverCard extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            hoverStateDetails: this.props.hoverStateDetails
        }
       
    }


    static getDerivedStateFromProps(props){
        return {
            hoverStateDetails: props.hoverStateDetails
        }
    }


    render() {
        let _this = this;
        return (
            <div className="state-detail-card">
                {Object.keys(this.state.hoverStateDetails).map(function(key) {
                    return <div className="state-detail"> {key} : {_this.state.hoverStateDetails[key]}</div>;
                })}
            </div>
        );
    }
}