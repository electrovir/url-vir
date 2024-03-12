import {PartialAndUndefined} from '@augment-vir/common';
import {Primitive} from 'type-fest';

/** The direction, if any, that url parsing should be encoded or decoded (or ignored). */
export enum UrlEncoding {
    /** Encode all input as URI values (when applicable), using `encodeURIComponent`. */
    Encode = 'encode',
    /** Decode all inputs from URI values (when applicable), using `decodeURIComponent`. */
    Decode = 'decode',
    /**
     * No decoding or encoding at all of any inputs: simply pass through values. This is the default
     * coding behavior.
     */
    None = 'none',
}

/**
 * Determines how to replace clashing search param keys. If `SearchParamStrategy.Clear` is used, it
 * also wipes all base search params.
 */
export enum SearchParamStrategy {
    /** Clear all base search params and add new ones. */
    Clear = 'clear',
    /**
     * Replace all base search param values with the new ones.
     *
     * This is the default strategy.
     */
    Replace = 'replace',
    /**
     * Append new search param values to the base search param values. This can result in multiple
     * search params with different values.
     */
    Append = 'append',
}

/** All options for parsing or building URLs. */
export type UrlOptions = PartialAndUndefined<{
    /**
     * Whether to encode, decode, or pass url parts as they're given. Default behavior is to pass
     * url parts as they are given.
     */
    encoding: UrlEncoding;
    /**
     * Determines how to handle conflicts between base search param values and new search param
     * values.
     */
    searchParamStrategy: SearchParamStrategy;
}>;

/**
 * Apply coding to multiple values. Removes `undefined` and `null` values and converts non-string
 * values into strings.
 */
export function codeValues(
    values: ReadonlyArray<Primitive>,
    options: Readonly<Pick<UrlOptions, 'encoding'>> | undefined,
): string[] {
    return values
        .map((value) => {
            if (value == undefined) {
                return undefined;
            } else {
                return codeValue(String(value), options);
            }
        })
        .filter((entry): entry is string => entry != undefined);
}

/** Encode or Decode or pass through a value as per the configured encoding option. */
export function codeValue(
    value: string,
    options: Readonly<Pick<UrlOptions, 'encoding'>> | undefined,
): string {
    if (options?.encoding === UrlEncoding.Decode) {
        return decodeURIComponent(value);
    } else if (options?.encoding === UrlEncoding.Encode) {
        return encodeURIComponent(value);
    } else {
        return value;
    }
}
