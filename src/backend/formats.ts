import * as util from "./util";
import * as parser from "./stringParser";

/**
 * tries to parse `text` first as json, then "list of variables", then ...
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
    const withSlashes = text.replace(/\\/g, String.fromCharCode(92,92));
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

// wraps nested objects in brackets, 
// then converts "list of variables" to actual json, using a bunch of `.replace()`s,
// finally parses json as object / null
const parseListOfVars = (text: string) => parseJson(nestedObjectsWrapped(text)
    .replace(/"/g, `\\"`)   // converts "list of variables" to actual json first 

    .replace(/{/g, `{"`)    // using a bunch of `.replace()`s
    .replace(/}/g, `"}`)    // then parses json and converts to object / null

    .replace(/ = /g, `=`)
    .replace(/=/g, `": "`)
    
    .replace(/, /g, `,`)
    .replace(/,/g, `", "`)
) 

// recursive
const nestedObjectsWrapped = (text: string, wrapped: string = ""): string => {
    const vars = ["O", "C", "L"];
    const startsOfVarList = vars.map((key: string) => `=${key}=`);
    const start = util.firstIndexOfAny(text, startsOfVarList);
    if (start === -1)  return wrapped + text;

    wrapped += text.substring(0, start) + "={";
    const assignmentsSplit = util.groupBy<string>(
        text.substring(start + 1).split(", "), 
        (equation: string) => vars.includes(parser.extract(equation, "{0}={1}")[0])
    )[0];
    const assignments = assignmentsSplit.join(", ");
    wrapped += assignments + "}";
    
    return nestedObjectsWrapped(util.after(text, assignments), wrapped);
}