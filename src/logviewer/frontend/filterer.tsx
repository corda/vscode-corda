import React from "react";

interface FiltererProps {
    filterBy: string;
}


export const Filterer: React.FunctionComponent<FiltererProps> = ({filterBy}: FiltererProps) => {
    const shouldBeHidden = (collapsible: Element) => 
        Array.from(collapsible.children)
            .filter(tag => tag.tagName === "p")
            .every(pTag => !pTag.textContent?.includes(filterBy))
    
    const hide = (collapsible: Element) => 
        collapsible.setAttribute("style", "font-size: 0px")

    const filterEls = () => 
        Array.from(document.getElementsByClassName("Collapsilbe"))
            .filter(shouldBeHidden)
            .forEach(hide)
        
    return <button onClick={filterEls}> Filter by {filterBy} </button>
}