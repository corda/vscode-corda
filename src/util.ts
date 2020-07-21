/**
 * returns the substring of `line` that is (strictly) before the first instance of `before`
 * 
 * returns `line` if `before` is empty, or is not present in `line`
 */
export const beforeFirst = (line: string, before: string) => { 
    if (line.includes(before) && before !== "") return line.split(before)[0]; 
    return line;
}


const firstIdxOf = (text: string, toFinds: Array<string>): number => {
    const indices = toFinds
        .map((toFind: string) => text.indexOf(toFind))
        .filter((i: number, _: any) => i != -1);
    return indices.length === 0 ? -1 : Math.min(...indices);
}

/**
 * returns `text` splitted by each of the elements in `splitBy` 
 */
export const splitOnAny = (text: string, splitBy: Array<string>): Array<string> => {
    let i = firstIdxOf(text, splitBy);
    if (i === -1)   return [text];
    
    const splitted = [text.substring(0, i)]
    let deltaI = null;

    while (deltaI !== 0) {
        deltaI = 1 + firstIdxOf(text.substring(i + 1), splitBy);

        const toPush = deltaI === 0 ? text.substring(i) : text.substring(i, i + deltaI);
        if (toPush !== "") splitted.push(toPush);
        i += deltaI;
    }

    return splitted;
}
/**
 * returns the substring of `line` that is after the first instance of `after`
 * 
 * returns `line` if `after` is empty, or is not present in `line`
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

const isNotNullPojo = (object: any) => (object !== null && typeof object === "object")

export const firstNotNullPojo = (...objects: any[]) => {
    const filtered = objects.filter(obj => isNotNullPojo(obj));
    return filtered.length === 0 ? {} : filtered[0];
}

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
