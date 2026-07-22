import {check} from '@augment-vir/assert';
import {
    addPrefix,
    ensureArray,
    filterMap,
    filterObject,
    getOrSet,
    mapObjectValues,
    type MaybeArray,
    safeSplit,
} from '@augment-vir/common';
import {defineShape, recordShape} from 'object-shape-tester';
import {type Primitive, type ReadonlyDeep} from 'type-fest';
import {codeValue, codeValues, SearchParamStrategy, type UrlOptions} from './url-options.js';

/**
 * Shape definition for `SearchParams`.
 *
 * @category Util
 */
export const searchParamsShape = defineShape(
    recordShape({
        keys: '',
        values: [''],
    }),
);

/**
 * Key-value storage for URL search parameters.
 *
 * @category Type
 */
export type SearchParams = typeof searchParamsShape.runtimeType;

/**
 * Less strict version of `SearchParams` that allows string or undefined values for overriding or
 * setting search params.
 *
 * @category Internal
 */
export type SearchParamsInput = Record<string, MaybeArray<Exclude<Primitive, symbol>>>;

/**
 * Combine two objects of search params. Configure the combination strategy using the third
 * `options` input.
 *
 * @category Util
 */
// eslint-disable-next-line @virmator/prefer-params-object
export function combineSearchParams(
    baseParams: Readonly<SearchParamsInput>,
    newParams: Readonly<SearchParamsInput>,
    options?: Readonly<Pick<UrlOptions, 'searchParamStrategy' | 'encoding'>> | undefined,
): SearchParams {
    const actualBaseParams: Record<
        string,
        ReadonlyArray<Primitive>
    > = options?.searchParamStrategy === SearchParamStrategy.Clear
        ? {}
        : mapObjectValues(baseParams, (key, value) => {
              return ensureArray(value);
          });

    const searchParams = mapObjectValues(
        newParams,
        (paramKey, newValue): ReadonlyArray<string | undefined> | undefined => {
            if (options?.searchParamStrategy === SearchParamStrategy.Append) {
                const baseValue = actualBaseParams[paramKey];
                const baseValueArray = check.isArray(baseValue) ? baseValue : [baseValue];

                if (newValue) {
                    const newValueArray = check.isArray(newValue) ? newValue : [newValue];

                    return codeValues(
                        [
                            ...baseValueArray,
                            ...newValueArray,
                        ],
                        options,
                    );
                } else {
                    return codeValues(baseValueArray, options);
                }
            } else if (check.isArray(newValue)) {
                return codeValues(newValue, options);
            } else if (newValue) {
                return codeValues([newValue], options);
            } else {
                return undefined;
            }
        },
    );

    const joinedSearchParams = filterObject(
        {
            ...actualBaseParams,
            ...searchParams,
        },
        (key, value): value is string[] => {
            return !!value;
        },
    ) as SearchParams;

    return joinedSearchParams;
}

/**
 * Convert a search param string, `URL` instance, or `URLSearchParams` instance into an object of
 * search params. Note that a search param string _must_ start with `'?'`.
 *
 * @category Main
 * @example
 *
 * ```ts
 * import {searchParamsToObject} from 'url-vir';
 *
 * searchParamsToObject('?hello=there&cheese'); // `{hello: ['there'], cheese: []}`
 * ```
 */
export function searchParamsToObject(
    input: string | Readonly<Pick<URL, 'search'>> | URLSearchParams,
    options?: ReadonlyDeep<UrlOptions> | undefined,
): SearchParams {
    if (check.isString(input) && !input.includes('?')) {
        return {};
    }

    /**
     * This does not use the global `URLSearchParams` class because that automatically encodes
     * params, which we want to leave up to the consumer.
     */
    const rawSearchString: string = check.isString(input)
        ? input
        : input instanceof URLSearchParams
          ? input.toString()
          : input.search;

    /**
     * A `#` starts the fragment, which is not part of the search, so strip from the first `#`
     * (consistent with `parseUrl` and browsers). This must happen before the prefix is removed
     * below: the two can't be combined into one alternation because only the first alternative of a
     * single non-global replace fires.
     */
    const fragmentIndex = rawSearchString.indexOf('#');
    const withoutFragment =
        fragmentIndex === -1 ? rawSearchString : rawSearchString.slice(0, fragmentIndex);
    /**
     * Strip the prefix up to and including the _first_ `?`. A greedy `^.*\?` would strip up to the
     * _last_ `?`, dropping every param before a `?` that appears inside a query value (e.g. a
     * `redirect=https://x.com?y=1` param). A `URLSearchParams` string has no `?`, so it is left
     * intact.
     */
    const searchString = withoutFragment.replace(/^[^?]*\?/, '');

    const paramEntries = searchString
        /**
         * Drop empty segments so a lone `?`, leading/trailing `&`, or doubled `&&` doesn't produce
         * a spurious empty-string key (matching how the browser's `URLSearchParams` ignores them).
         * A segment like `=value` is not empty and is preserved as an empty-key param.
         */
        .split('&')
        .filter((param) => param !== '')
        .map(
            (
                param,
            ): [
                string,
                string | undefined,
            ] => {
                const [
                    key,
                    ...values
                ] = safeSplit({
                    value: param,
                    splitter: '=',
                });

                return [
                    key,
                    values.length ? values.join('=') : undefined,
                ];
            },
        );

    return paramEntries.reduce(
        (
            accum: SearchParams,
            [
                key,
                value,
            ],
        ) => {
            const coded = codeParamKeyValue({
                options,
                key,
                value,
            });

            const existingKeyValue = getOrSet(accum, coded.key, () => []);

            if (value != undefined) {
                existingKeyValue.push(coded.value);
            }

            return accum;
        },
        {},
    );
}

function wrapParamValue(
    value: Primitive | ReadonlyArray<Primitive>,
): ReadonlyArray<Primitive> | undefined {
    if (value == undefined) {
        return undefined;
    } else if (check.isArray(value)) {
        return [...value];
    } else if (value === '') {
        return [];
    } else {
        return [value];
    }
}

/**
 * Convert an object into a search param string. Note the following:
 *
 * - All non-string values are converted into strings.
 * - Keys with `undefined` or `null` values will be omitted from the string.
 * - To include a key without any value, set the key to an empty string.
 * - The leading `'?'` is included in the return string.
 * - If no key-value pairs are included, this returns an empty string.
 *
 * @category Main
 * @example
 *
 * ```ts
 * import {searchParamsToString} from 'url-vir';
 *
 * searchParamsToString({hello: ['there'], cheese: ['']}); // `'?hello=there&cheese'`
 * ```
 */
export function searchParamsToString(
    input: Readonly<SearchParamsInput>,
    options?: ReadonlyDeep<UrlOptions> | undefined,
): string {
    /**
     * This does not use the global `URLSearchParams` class because that automatically encodes
     * params, which we want to leave up to the options input.
     */
    const mappedValues: string[] = filterMap(
        Object.entries(input),
        ([
            key,
            rawValue,
        ]): string[] => {
            const values = wrapParamValue(rawValue);

            if (values?.length) {
                return values.map((value) => {
                    const coded = codeParamKeyValue({
                        options,
                        key,
                        value,
                    });

                    return [
                        coded.key,
                        coded.value,
                    ].join('=');
                });
            } else {
                return [key];
            }
        },
        (
            mappedOutput,
            [
                ,
                value,
            ],
        ) => value != undefined,
    ).flat();

    if (!mappedValues.length) {
        return '';
    }

    return addPrefix({
        value: mappedValues.join('&'),
        prefix: '?',
    });
}

function codeParamKeyValue({
    options,
    key,
    value,
}: Readonly<{
    key: string;
    value: Primitive;
    options: Readonly<Pick<UrlOptions, 'encoding'>> | undefined;
}>): {key: string; value: string} {
    return {
        key: codeValue(key, options),
        value: codeValue(String(value), options),
    };
}
