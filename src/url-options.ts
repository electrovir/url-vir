import {defineShape, enumShape, optional, or} from 'object-shape-tester';
import {Primitive} from 'type-fest';

/**
 * Determines whether url parsing should using encoding, decoding, or neither.
 *
 * @category Type
 */
export enum UrlEncoding {
    /** Encode inputs as URI values (when applicable), using `encodeURIComponent`. */
    Encode = 'encode',
    /** Decode inputs from URI values (when applicable), using `decodeURIComponent`. */
    Decode = 'decode',
    /**
     * No decoding or encoding of any inputs: simply pass through values unchanged. This is the
     * default encoding behavior.
     */
    None = 'none',
}

/**
 * Determines how to replace clashing search param keys. If {@link SearchParamStrategy.Clear} is
 * used, it also wipes all base search params.
 *
 * @category Type
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

/**
 * Shape definition for {@link UrlOptions}.
 *
 * @category Internal
 */
export const urlOptionsShape = defineShape({
    /**
     * Whether to encode, decode, or pass url parts as they're given. Default behavior is to pass
     * url parts as they are given.
     */
    encoding: optional(or(undefined, enumShape(UrlEncoding))),
    /**
     * Determines how to handle conflicts between base search param values and new search param
     * values.
     */
    searchParamStrategy: optional(or(undefined, enumShape(SearchParamStrategy))),
});

/**
 * All options for parsing or building URLs.
 *
 * @category Type
 */
export type UrlOptions = typeof urlOptionsShape.runtimeType;

/**
 * Apply coding to multiple values. Removes `undefined` and `null` values and converts non-string
 * values into strings.
 *
 * @category Internal
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

/**
 * Encode or Decode or pass through a value as per the configured encoding option.
 *
 * @category Internal
 */
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
