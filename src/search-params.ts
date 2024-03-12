import {
    addPrefix,
    filterMap,
    filterObject,
    getOrSet,
    mapObjectValues,
    typedSplit,
} from '@augment-vir/common';
import {defineShape, indexedKeys} from 'object-shape-tester';
import {isRunTimeType} from 'run-time-assertions';
import {Primitive} from 'type-fest';
import {ReadonlyObjectDeep} from 'type-fest/source/readonly-deep';
import {SearchParamStrategy, UrlOptions, codeValue, codeValues} from './url-options';

/** Shape definition for `SearchParams`. */
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
 * @category Primary Exports
 */
export type SearchParams = typeof searchParamsShape.runTimeType;

/**
 * Less strict version of `SearchParams` that allows string or undefined values for overriding or
 * setting search params.
 */
export type SearchParamsInput = Record<string, Primitive | ReadonlyArray<Primitive>>;

/**
 * Combine two objects of search params. Configure the combination strategy using the third
 * `options` input.
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
                  if (isRunTimeType(value, 'string')) {
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
                const baseValueArray = isRunTimeType(baseValue, 'array') ? baseValue : [baseValue];

                if (newValue) {
                    const newValueArray = isRunTimeType(newValue, 'array') ? newValue : [newValue];

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
            } else if (isRunTimeType(newValue, 'array')) {
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
 * @category Primary Exports
 * @example
 *     searchParamsToObject('?hello=there&cheese') ===
 *         {
 *             hello: ['there'],
 *             cheese: [''],
 *         };
 */
export function searchParamsToObject(
    input: string | ReadonlyObjectDeep<Pick<URL, 'searchParams'>> | URLSearchParams,
    options?: ReadonlyObjectDeep<UrlOptions> | undefined,
): SearchParams {
    if (isRunTimeType(input, 'string') && !input.includes('?')) {
        return {};
    }

    /**
     * This does not use the global `URLSearchParams` class because that automatically encodes
     * params, which we want to leave up to the consumer.
     */
    const rawSearchString: string = isRunTimeType(input, 'string')
        ? input
        : input instanceof URL
          ? input.search
          : input.toString();

    const searchString = rawSearchString.replace(/^.*\?|\#.*$/, '');

    const paramEntries = searchString.split('&').map((param): [string, string] => {
        const [
            key,
            ...values
        ] = typedSplit(param, '=');
        return [
            key,
            values.join('='),
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

            existingKeyValue.push(coded.value);

            return accum;
        },
        {},
    );
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
 * @category Primary Exports
 * @example
 *     searchParamsToObject({
 *         hello: ['there'],
 *         cheese: [''],
 *     }) === '?hello=there&cheese';
 */
export function searchParamsToString(
    input: Readonly<SearchParamsInput>,
    options?: ReadonlyObjectDeep<UrlOptions> | undefined,
): string {
    const entries: [string, Primitive][] = Object.entries(input).flatMap(
        ([
            key,
            value,
        ]): [string, Primitive][] => {
            if (isRunTimeType(value, 'array')) {
                return value.map((valueArrayEntry) => [
                    key,
                    valueArrayEntry,
                ]);
            } else {
                return [
                    [
                        key,
                        value,
                    ],
                ];
            }
        },
    );

    /**
     * This does not use the global `URLSearchParams` class because that automatically encodes
     * params, which we want to leave up to the options input.
     */
    const mappedValues = filterMap(
        entries,
        ([
            key,
            value,
        ]) => {
            const coded = codeParamKeyValue({options, key, value});

            if (value === '') {
                return coded.key;
            } else {
                return `${coded.key}=${coded.value}`;
            }
        },
        (
            mappedOutput,
            [
                ,
                value,
            ],
        ) => value != undefined,
    );

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
