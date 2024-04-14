import {defineShape} from 'object-shape-tester';
import {searchParamsShape} from './search-params';

/** Shape definition for `UrlParts`. */
export const urlPartsShape = defineShape({
    /** Http, https, wss, etc. */
    protocol: '',
    /**
     * Infrequently used username part of a url.
     *
     * @example
     *     buildUrl('https://anonymous:my-pass@developer.mozilla.org').username === 'anonymous';
     */
    username: '',
    /**
     * Infrequently used password part of a url.
     *
     * @example
     *     buildUrl('https://anonymous:my-pass@developer.mozilla.org').password === 'my-pass';
     */
    password: '',
    /**
     * Includes:
     *
     * - Hostname
     * - Port
     */
    host: '',
    /** Domain, subdomains, and TLD (.com). */
    hostname: '',
    /** Port part of the URL. If none exist, this will be an empty string. */
    port: '',
    /**
     * Includes:
     *
     * - Protocol
     * - Hostname
     * - Port
     */
    origin: '',
    /**
     * Everything between origin and search/hash without a leading slash. If none exist, this will
     * be simply `'/'`.
     */
    pathname: '/',
    /** Each path part of the pathname. */
    paths: [''],
    /**
     * Everything after a ?, excluding the hash, as a string. If none exist, this will be an empty
     * string.
     */
    search: '',
    /**
     * An object representation of the parameters contained within the search string. If none exist,
     * it will be an empty object.
     */
    searchParams: searchParamsShape,
    /** Everything after the hash (#). If none exist, this will be an empty string. */
    hash: '',
    /**
     * Includes:
     *
     * - Pathname
     * - Search
     * - Hash
     */
    fullPath: '/',
    /** The full url string. */
    href: '/',
});

/** An example of empty `UrlParts` for convenience's sake. */
export const emptyUrlParts = {
    ...urlPartsShape.defaultValue,
    searchParams: {},
    paths: [],
} as const satisfies UrlParts;

/**
 * The output of `buildUrl`. See its docs for more details.
 *
 * @category Primary Exports
 */
export type UrlParts = typeof urlPartsShape.runTimeType;
