import * as util from "./util";

/**
 * extracts from `line` the parts marked {0}, {1}, {2} etc. in `format`, where `format` otherwise matches up with `line`
 * 
 * e.g. 
 * 
 * `line` = `[INFO ] 2020/03/01 [main] blah`
 * 
 * `format` = `[{0} ] {1} [{2}] {3}`
 * 
 * extracts `[INFO, 2020/03/01, main, blah]` from `line`
 */
export const extract = (line: string, format: string) => _extract(line, format, new Array<string>(), 0);

/**
 * implementation of `extract` that takes an `Array<string>` to start with. 
 * Necessary because I wrote this using recursion
 */
const _extract = (line: string, format: string, els: Array<string>, id: number): Array<string> => {    
    const identifier = `{${id}}`;
    if (!format.includes(identifier)) return els;

    const nextIdentifier = `{${id + 1}}`;
    const prevIdentifier = `{${id - 1}}`;

    const beforeIdentifier = format.includes(prevIdentifier) ? 
                    util.between(format, prevIdentifier, identifier) : 
                    util.before(format, identifier);

    const afterIdentifier = format.includes(nextIdentifier) ? 
                    util.between(format, identifier, nextIdentifier) : 
                    util.after(format, identifier);

    const element = util.between(line, beforeIdentifier, afterIdentifier);
    
    return _extract(
        util.after(line, element), 
        util.after(format, identifier), 
        [...els, element], 
        id + 1
    );
}


/**
 * checks if `line` matches up with `format`, in the sense of `.extract`
 */
export const matchesFormat = (line: string, format: string) => _matchesFormat(line, format, 0);

// necessary because I used recursion
const _matchesFormat = (line: string, format: string, id: number) : boolean => {
    const identifier = `{${id}}`;
    if (!format.includes(identifier)) return true;

    if (line.startsWith(util.before(format, identifier))) {
        const nextIdentifier = `{${id + 1}}`;
        const betweenIdentifiers = util.between(format, identifier, nextIdentifier);
        if (!line.includes(betweenIdentifiers)) return false;

        const formatAfterIdentifier = util.after(format, identifier);
        const lineAfterElement = betweenIdentifiers + util.after(line, betweenIdentifiers);
        
        return _matchesFormat(lineAfterElement, formatAfterIdentifier, id + 1); 
    }

    return false;
}