/**
 * returns the substring of `line` that is (strictly) before the first instance of `before`
 * 
 * returns `line` if `before` is empty, or is not present in `line`
 */
export const beforeFirst = (line: string, before: string) => { 
    if (line.includes(before) && before !== "") return line.split(before)[0]; 
    return line;
}

/**
 * returns the substring of `line` that is (strictly) after the first instance of `after`
 * 
 * returns `line` if `after` is empty, or is not present in `line`
 */
export const afterFirst = (line: string, after: string) => {
    if (line.includes(after) && after !== "") return line.split(after)[1];
    return line;
}

const firstIndexOfAny = (text: string, toFinds: Array<string>): number => {
    const indices = toFinds
        .map((toFind: string) => text.indexOf(toFind))
        .filter((i: number, _: any) => i != -1);
    return indices.length === 0 ? -1 : Math.min(...indices);
}

/**
 * returns `text` splitted by each of the elements in `splitBy` 
 */
export const splitByAll = (text: string, splitBy: Array<string>): Array<string> => {
    let i = firstIndexOfAny(text, splitBy);
    if (i === -1)   return [text];
    
    const splitted = [text.substring(0, i)]
    let deltaI = null;

    while (deltaI !== 0) {
        deltaI = 1 + firstIndexOfAny(text.substring(i + 1), splitBy);

        const toPush = deltaI === 0 ? text.substring(i) : text.substring(i, i + deltaI);
        if (toPush !== "") splitted.push(toPush);
        i += deltaI;
    }

    return splitted;
}

/**
 * returns the substring of `line` that is between the first instance of `before` and the last instance of `after`
 * 
 * ignores either of `before` or `after` if they are not present in `line`, or are empty
 */
export const between = (line: string, before: string, after: string) => beforeFirst(afterFirst(line, before), after);

export const isInteger = (string: string) => /^-{0,1}\d+$/.test(string)

/**
 * checks if `object` is the empty object, `{}`
 */
export const isEmptyObject = (object: any) => Object.keys(object).length === 0

/**
 * extracts from `line` the parts marked {1}, {2}, {3} etc. in `format`, where `format` otherwise matches up with `line`
 * 
 * e.g. 
 * 
 * `line` = `[INFO ] 2020/03/01 [main] blah`
 * 
 * `format` = `[{1} ] {2} [{3}] {4}`
 * 
 * extracts `[INFO, 2020/03/01, main, blah]` from `line`
 */
export const extract = (line: string, format: string) => _extract(line, format, new Array<string>());

/**
 * implementation of `extract` that takes an `Array<string>` to start with. 
 * Necessary because I wrote this using recursion
 */
const _extract = (line: string, format: string, els: Array<string>): Array<string> => {    
    let openCurlyIdx = 0;
    let insideCurlies = "";
    while (openCurlyIdx < format.length) {
        if (format[openCurlyIdx] === "{") {
            insideCurlies = beforeFirst(format.substring(openCurlyIdx + 1), "}")
            if (isInteger(insideCurlies)) {
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
    return _extract(afterFirst(line, element), afterFirst(format, identifier), els);
}
