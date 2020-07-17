import { open } from "fs";
import { setupMaster } from "cluster";

/**
 * returns the substring of `line` that is before the first instance of `before`
 * 
 * returns `line` if `before` is empty, or is not present in `line`
 */
export const beforeFirst = (line: string, before: string) => { 
    if (line.includes(before) && before !== "") return line.split(before)[0]; 
    return line;
}

/**
 * returns the substring of `line` that is after the first instance of `after`
 * 
 * returns `line` if `after` is empty, or is not present in `line`S
 */
export const afterFirst = (line: string, after: string) => {
    if (line.includes(after) && after !== "") return line.split(after)[1];
    return line;
}

/**
 * returns the substring of `line` that is between the first instance of `before` and the last instance of `after`
 * 
 * ignores either of `before` or `after` if they are not present in `line`, or are empty
 */
export const between = (line: string, before: string, after: string) => beforeFirst(afterFirst(line, before), after);

/**
 * checks if `line` is an integer (whole number)
 */
export const isIntegral = (line: string) => /^-{0,1}\d+$/.test(line)

/**
 * extracts substrings marked {1}, {2}, {3} etc. in `format`, where `format` otherwise matches up with `line`
 */
export const elements = (line: string, format: string) => _elements(line, format, new Array<string>());

/**
 * implementation of `elements` that takes an `Array<string>` to start with. Needed for recursion
 */
const _elements = (line: string, format: string, els: Array<string>): Array<string> => {    
    let openCurlyIdx = 0;
    let insideCurlies = "";
    while (openCurlyIdx < format.length) {
        if (format[openCurlyIdx] === "{") {
            insideCurlies = beforeFirst(format.substring(openCurlyIdx + 1), "}")
            if (isIntegral(insideCurlies)) {
                break;
            }
        }
        openCurlyIdx++;
    }

    if (insideCurlies === "") return els;

    const identifier = `{${insideCurlies}}`;
    const nextIdentifier = `{${parseInt(insideCurlies) + 1}}`;
    const prevIdentifier = `{${parseInt(insideCurlies) - 1}}`;

    const before = format.includes(prevIdentifier) ? between(format, prevIdentifier, identifier) : beforeFirst(format, identifier);
    const after = format.includes(nextIdentifier) ? between(format, identifier, nextIdentifier) : afterFirst(format, identifier);
    const element = between(line, before, after);
    
    els.push(element);
    return _elements(afterFirst(line, element), afterFirst(format, identifier), els);
}
