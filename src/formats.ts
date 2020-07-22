import * as util from "./util";

/**
 * tries to parse `text` first as json, then "equals json", then ...
 * 
 * if one of the parsing attempts works, it returns the parsed object, stopping there
 * 
 * if none of them work, it returns an empty object `{}`
 */
export const parseVars = (text: string) => parseJson(text) || parseListOfVars(text) || {};

/**
 * tries to parse `text` as json
 * 
 * returns `null` if it fails 
 */
const parseJson = (text: string) => {
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
/**
 * tries to parse `text` as a "list of variables", i.e.
 * 
 * `param1 = hi, param2 = hello there, param3 = bacon` notation
 * 
 * returns `null` if it fails
*/
const parseListOfVars = (text: string) => parseJson(text
    .replace(/"/g, `\\"`)   // converts "list of variables" to actual json first 

    .replace(/{/g, `{"`)    // using a bunch of `.replace()`s
    .replace(/}/g, `"}`)    // then parses json and converts to object / null

    .replace(/ = /g, `=`)
    .replace(/=/g, `": "`)
    
    .replace(/, /g, `,`)
    .replace(/,/g, `", "`)
) 