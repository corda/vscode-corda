import React, { ChangeEvent } from "react";

type updateFn = (searchText: string) => void;

export const SearchBox = (props: {placeholder: string, onUpdateText: updateFn}) =>
    <>
        <label htmlFor="search"> {props.placeholder} </label>
        <input 
            type="text"  
            onChange={event => props.onUpdateText(event.target.value)}
        />
    </>