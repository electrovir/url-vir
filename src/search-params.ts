import {check} from '@augment-vir/assert';
import {
    addPrefix,
    filterMap,
    filterObject,
    getOrSet,
    mapObjectValues,
    safeSplit,
} from '@augment-vir/common';
import {defineShape, indexedKeys} from 'object-shape-tester';
import {Primitive} from 'type-fest';
import {ReadonlyObjectDeep} from 'type-fest/source/readonly-deep';
import {SearchParamStrategy, UrlOptions, codeValue, codeValues} from './url-options.js';

/**
 * Shape definition for `SearchParams`.
 *
 * @category Util
 */
export const searchParamsShape = defineShape(
    indexedKeys({
        keys: '',
        values: [''],
        required: true,
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
export type SearchParamsInput = Record<string, Primitive | ReadonlyArray<Primitive>>;

/**
 * Combine two objects of search params. Configure the combination strategy using the third
 * `options` input.
 *
 * @category Util
 */
export function combineSearchParams(
    baseParams: Readonly<SearchParamsInput>,
    newParams: Readonly<SearchParamsInput>,
    options?: Readonly<Pick<UrlOptions, 'searchParamStrategy' | 'encoding'>> | undefined,
): SearchParams {
    const actualBaseParams =
        options?.searchParamStrategy === SearchParamStrategy.Clear
            ? {}
            : mapObjectValues(baseParams, (key, value) => {
                  if (check.isString(value)) {
                      return [value];
                  } else {
                      return value;
                  }
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
    options?: ReadonlyObjectDeep<UrlOptions> | undefined,
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

    const searchString = rawSearchString.replace(/(^.*\?)|(#[^#]*$)/, '');

    const paramEntries = searchString.split('&').map((param): [string, string | undefined] => {
        const [
            key,
            ...values
        ] = safeSplit(param, '=');

        return [
            key,
            values.length ? values.join('=') : undefined,
        ];
    });

    return paramEntries.reduce(
        (
            accum: SearchParams,
            [
                key,
                value,
            ],
        ) => {
            const coded = codeParamKeyValue({options, key, value});

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
    options?: ReadonlyObjectDeep<UrlOptions> | undefined,
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
                    const coded = codeParamKeyValue({options, key, value});

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

    return addPrefix({value: mappedValues.join('&'), prefix: '?'});
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
