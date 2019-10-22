import React from 'react';
import Autosuggest from 'react-autosuggest';
import { TextField } from '@material-ui/core';
import MenuItem from '@material-ui/core/MenuItem';


  
  // https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters
  function escapeRegexCharacters(str) {
      var myRe = new RegExp(/(.{64})\((\d*)\)/g)
      var regExVal = myRe.exec(str);
      console.log("RegEx Val " + JSON.stringify(regExVal));
    return regExVal;
  }
  
    // const escapedValue = escapeRegexCharacters(value.trim());
    
    // if (escapedValue === '') {
    //   return [];
    // }
  
    // const regex = new RegExp('^' + escapedValue, 'i');
  
    // return languages.filter(language => regex.test(language));
  
  function renderSuggestion(suggestion) {

        var regExVal = escapeRegexCharacters(suggestion)
      
        return (
          <MenuItem component="div">
            <div>
            <span>{regExVal[1] + " index: " + regExVal[2]}</span>
            </div>
          </MenuItem>
        );
      }

//   function renderSuggestion(suggestion) {
//       var regExVal = escapeRegexCharacters(suggestion)
//     return (
//       <span>{regExVal[1] + " index: " + regExVal[2]}</span>
//     );
//   }
  
  export default class VQueryAutosuggest extends React.Component {
    constructor(props) {
      super();
  
      this.state = {
        value: '',
        stateRefOptions: props.stateRefOptions,
        suggestions: []
      };    
      this.onChange = this.onChange.bind(this);
      this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
      this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
      this.getSuggestionValue = this.getSuggestionValue.bind(this);
      this.renderInputComponent = this.renderInputComponent.bind(this);
      
    }

    static getDerivedStateFromProps(props, state) {
      if(props.stateRefOptions !== state.stateRefOptions) {
        return {
          stateRefOptions: props.stateRefOptions,
        };
      }

      // Return null if the state hasn't changed
      return null;
    }

    renderInputComponent(inputProps) {
        const { classes, inputRef = () => {}, ref, ...other } = inputProps;
      
        return (
          <TextField
            InputLabelProps={{
                classes: {
                    root: "input-field-label",
                    focused: "input-field-label-focused",
                    shrink: "input-field-label-focused"
                },
            }}
            InputProps={{
              classes: {
                root: "input-field"
              },
              inputRef: node => {
                ref(node);
                inputRef(node);
              },
              
            }}
            {...other}
          />
        );
      }

    getSuggestionValue(suggestion) {
        console.log("get suggestions!!!")
        var regExVal = escapeRegexCharacters(suggestion);
          this.props.setStateRefState(regExVal[1], regExVal[2]);
      return "";
    }

    getSuggestions(value) {
        console.log("getSuggestions" + JSON.stringify(value))

        const inputValue = value.trim().toLowerCase();
        const inputLength = inputValue.length;
        return inputLength === 0 // no input then no suggestion, else
          ? []
          : this.state.stateRefOptions.filter(
              item => escapeRegexCharacters(item)[1].toLowerCase().slice(0, inputLength) === inputValue
            );
    }
  
    onChange (event, { newValue, method }) {
      this.setState({
        value: newValue
      });
    };
    
    onSuggestionsFetchRequested({ value }) {
      this.setState({
        suggestions: this.getSuggestions(value)
      });
    };
  
    onSuggestionsClearRequested() {
      this.setState({
        suggestions: []
      });
    };
  
    render() {
      const { value, suggestions } = this.state;
      const inputProps = {
        className: "input-field-text",
        label: "StateRef",
        value,
        onChange: this.onChange
      };
  
      return (
        <Autosuggest 
          suggestions={suggestions}
          onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.onSuggestionsClearRequested}
          getSuggestionValue={this.getSuggestionValue}
          renderSuggestion={renderSuggestion}
          renderInputComponent={this.renderInputComponent}
          inputProps={inputProps} 
          theme={{
            suggestionsContainerOpen : "menu-item-autosuggest",
            suggestionsList: "menu-item-autosuggest-list",
            container : "menu-item-autosuggest-container"

            }}
          
          />
      );
    }
  }
  