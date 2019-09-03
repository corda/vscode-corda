import React from 'react';
import CloseIcon from '@material-ui/icons/Close';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles, Theme } from '@material-ui/core/styles';


export default class SnackBarWrapper extends React.Component {
  

    constructor(props) {
        
        super(props);
        this.state = {
            message : props.message
          
        }

        this.variantIcon = {
            success: CheckCircleIcon,
            error: ErrorIcon
          };


        this.handleClose = this.handleClose.bind(this);
        

    }

 

    static getDerivedStateFromProps(props){
        return {
        }
    }

    handleClose(event, reason){
        if(reason === 'clickaway'){
            return;
        }
        const { remove } = this.props;
        remove(this.state.message);
    }

    render() {
        let Icon = this.variantIcon[this.state.message.type];
        return(
            <Snackbar
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              open={open}
              className="snackbar"
              onClose={this.handleClose}
            >
                <SnackbarContent
                    className={"snackbar-content-" + this.state.message.type}
                    aria-describedby="client-snackbar"
                    
                    message={
                        
                        <span id="client-snackbar" className="snackbar-message" >
                            <Icon />
                            <span className="snackbar-message-text"> {this.state.message.content} </span>
                        </span>
                    }
                    action={[
                        <IconButton key="close" aria-label="close" color="inherit" onClick={this.handleClose}>
                        <CloseIcon />
                        </IconButton>,
                    ]} />
             </Snackbar>
        );
    }
}