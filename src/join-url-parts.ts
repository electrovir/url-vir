import {removePrefix} from '@augment-vir/common';

const protocolSplit = '://';

/**
 * Joins all given arguments together as if they were parts of a URL. Preserves trailing slashes and
 * removes consecutive slashes in the path.
 *
 * @category Primary Exports
 * @example
 *     joinToUrl('https://example.com', 'path1', 'path2/', '/path3/') ===
 *         'https://example.com/path1/path2/path3/';
 */
export function joinUrlParts(...urlParts: ReadonlyArray<string>): string {
    const rawJoined = urlParts.join('/');
    const [
        protocol,
        rawRest = '',
    ] = rawJoined.includes(protocolSplit)
        ? rawJoined.split(protocolSplit)
        : [
              '',
              rawJoined,
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
                            ? removePrefix({value: subsequentSearchParams, prefix: '&'})
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
