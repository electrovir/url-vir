import {removePrefix} from '@augment-vir/common';

const protocolSplit = '://';

/**
 * Joins all given arguments together as if they were paths of a URL. Preserves trailing slashes and
 * removes consecutive slashes in the path. For more complex URL building, use `buildUrl`.
 *
 * @category Main
 * @example
 *
 * ```ts
 * import {joinUrlPaths} from 'url-vir';
 *
 * joinUrlPaths('https://example.com', 'path1', 'path2/', '/path3/');
 * // `'https://example.com/path1/path2/path3/'`
 * ```
 */
export function joinUrlPaths(...urlParts: ReadonlyArray<string>): string {
    const rawJoined = urlParts.join('/');
    /**
     * Split on only the _first_ `://`: any later `://` (e.g. a full URL passed as a path segment)
     * is part of the path, not another protocol separator. Splitting on every `://` would discard
     * everything after the second one.
     */
    const protocolSplitIndex = rawJoined.indexOf(protocolSplit);
    const [
        protocol,
        rawRest,
    ] =
        protocolSplitIndex === -1
            ? [
                  '',
                  rawJoined,
              ]
            : [
                  rawJoined.slice(0, protocolSplitIndex),
                  rawJoined.slice(protocolSplitIndex + protocolSplit.length),
              ];

    let reduceSearchParamsStarted = false;
    const fixedRest = rawRest
        .replace(/\/{2,}/g, '/')
        .split('/')
        .reduce(
            (fillingUpArray, currentEntry, currentIndex, inputArray) => {
                if (reduceSearchParamsStarted) {
                    return fillingUpArray;
                }

                const nextEntry = inputArray[currentIndex + 1];

                let newEntry = currentEntry;

                const nextStartsWithQuestion = nextEntry?.startsWith('?');
                const nextHasQuestion = !currentEntry.includes('?') && nextStartsWithQuestion;
                const nextIsQuestion = nextEntry === '?';

                if (nextStartsWithQuestion || nextHasQuestion) {
                    reduceSearchParamsStarted = true;
                    let foundHash = false;
                    const subsequentSearchParams = inputArray
                        .slice(currentIndex + 2)
                        .reduce((joinedParams, currentParam) => {
                            if (currentParam.includes('#')) {
                                foundHash = true;
                            }

                            if (foundHash) {
                                return joinedParams.concat(currentParam);
                            } else {
                                return [
                                    joinedParams,
                                    currentParam,
                                ].join('&');
                            }
                        }, '');

                    newEntry = [
                        currentEntry,
                        nextEntry,
                        nextIsQuestion
                            ? removePrefix({
                                  value: subsequentSearchParams,
                                  prefix: '&',
                              })
                            : subsequentSearchParams,
                    ].join('');
                }

                return fillingUpArray.concat(newEntry);
            },
            [] as (string | undefined)[],
        );
    return [
        protocol,
        protocol ? protocolSplit : '',
        fixedRest.join('/'),
    ].join('');
}
