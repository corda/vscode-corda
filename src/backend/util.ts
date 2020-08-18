/**
 * returns the substring of `line` that is (strictly) before the first instance of `before`
 * 
 * returns `line` if `before` is empty, or is not present in `line`
 */
export const before = (line: string, before: string) => { 
    if (line.includes(before) && before !== "") return line.split(before)[0]; 
    return line;
}


/**
 * returns the substring of `line` that is (strictly) after the first instance of `after`
 * 
 * returns `line` if `after` is empty, or is not present in `line`
 */
export const after = (line: string, after: string) => {
    if (line.includes(after) && after !== "") return line.split(after).slice(1).join(after);
    return line;
}


export const firstIndexSuchThat = <T>(items: T[], condition: (item: T) => boolean) => 
    items.some(condition) 
        ? Array(...items.keys())
            .filter(i => condition(items[i]))
            [0] 
        : -1


export const firstIndexOfAny = (text: string, toFinds: Array<string>): number => {
    const indices = toFinds
        .map(toFind => text.indexOf(toFind))
        .filter(i => i != -1);
    return indices.length === 0 ? -1 : Math.min(...indices);
}


/**
 * returns `text` splitted by each of the elements in `splitBy` 
 */
export const splitByAll = (text: string, splitBy: Array<string>): Array<string> => {
    let i = firstIndexOfAny(text, splitBy);
    if (i === -1)   return [text];
    
    const splitted = [text.substring(0, i)]
    let deltaI = -1;

    while (deltaI !== 0) {
        deltaI = 1 + firstIndexOfAny(text.substring(i + 1), splitBy);

        const toPush = deltaI === 0 ? text.substring(i) : text.substring(i, i + deltaI);
        if (toPush !== "") splitted.push(toPush);
        i += deltaI;
    }

    return splitted;
}


/**
 * returns the substring of `line` that is between the first instance of `Before` and the first instance of `After`
 * 
 * ignores either of `Before` or `After` if they are not present in `line`, or are empty
 */
export const between = (line: string, Before: string, After: string) => before(after(line, Before), After);

export const isInteger = (string: string) => /^-{0,1}\d+$/.test(string)

/**
 * checks if `object` is an empty object, `{ }`
 */
export const isEmptyObject = (object: any) => Object.keys(object).length === 0

/**
 * groups `items` into a list of sequential items that match `condition`
 * 
 * this is a generic function. the type passed is the type of the elements that are in `items`
 */
export const groupBy = <T>(items: T[], condition: (item: T) => boolean): T[][] => {
    let grouped = Array<T[]>();
    let i = 0;
    while (i < items.length) {
        if (condition(items[i])) {
            let group = new Array<T>(items[i]);
            let deltaI = 1;
            while (i + deltaI < items.length && condition(items[i + deltaI])) {
                group.push(items[i + deltaI]);
                deltaI++;
            }
            grouped.push(group);
            i += deltaI;
        }
        else {
            i++;
        }
    }
    return grouped;
}

/**
 * `list[startAt : startAt + sublist.length] = ...sublist`
 */
export const placeAt = <T>(list: T[], sublist: T[], startAt: number) => {
    for (let i = 0; i < sublist.length; i++) {
        list[startAt + i] = sublist[i];
    }
    return list;
}


export const bound = (min: number, x: number, max: number) => Math.max(min, Math.min(x, max))