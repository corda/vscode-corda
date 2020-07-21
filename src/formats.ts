import * as util from "./util";

/**
 * if it can parse `text` as some variant of JSON, it returns the JSON
 * 
 * otherwise, it defaults to the empty object
 */
export const textToJson = (text: string) => util.firstNotNullPojo(
    parseJson(text),
    parseEqualsJson(text),
    {}
)

export const parseJson = (text: string) => {
    const withSlashes = text.replace(/\\/g,String.fromCharCode(92,92));
    if (withSlashes.includes("{") && withSlashes.includes("}")) {
        try {
            const object = JSON.parse(withSlashes)
            if (object && typeof object === "object") {
                return object;
            }
        }
        catch (e) {}
    }
    
    return null;
}

const parseEqualsJson = (text: string) => parseJson(text
    .replace(/"/g, "\\\"")
    .replace(/{/g, "{\"")
    .replace(/}/g, "\"}")
    .replace(/=/g, "\": \"")
    .replace(/, /g, "\", \"")) 
    // PROBLEM: can't then manage commas w/o a space, 
    //else it would overwrite itself.
    // learn regex