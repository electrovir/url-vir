import {defineShape} from 'object-shape-tester';
import {searchParamsShape} from './search-params.js';

/**
 * Shape definition for {@link UrlParts} for use with the
 * [`object-shape-tester`](https://www.npmjs.com/package/object-shape-tester) package.
 *
 * @category Util
 */
export const urlPartsShape = defineShape({
    /** Http, https, wss, etc. */
    protocol: '',
    /**
     * Infrequently used username part of a url.
     *
     * @example BuildUrl('https://anonymous:my-pass@developer.mozilla.org').username ===
     * 'anonymous';
     */
    username: '',
    /**
     * Infrequently used password part of a url.
     *
     * @example BuildUrl('https://anonymous:my-pass@developer.mozilla.org').password === 'my-pass';
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
    /** Each hostname domain without its separating dot. */
    domains: [''],
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
     * Everything between origin and search/hash with a leading slash. If none exist, this will be
     * simply `'/'`.
     */
    pathname: '/',
    /** Each path part of the pathname. */
    paths: [''],
    /**
     * Everything after a ?, excluding the hash, including `?`, as a string. If none exist, this
     * will be an empty string.
     */
    search: '',
    /**
     * An object representation of the parameters contained within the search string. If none exist,
     * it will be an empty object.
     */
    searchParams: searchParamsShape,
    /**
     * Everything after the hash (#), including the hash itself. If none exist, this will be an
     * empty string.
     *
     * @example '#/my/hash/route'
     */
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

/**
 * An example of empty `UrlParts` for convenience's sake.
 *
 * @category Util
 */
export const emptyUrlParts = {
    ...urlPartsShape.default,
} as const satisfies UrlParts;

/**
 * The output of `buildUrl`. See its docs for more details.
 *
 * @category Type
 */
export type UrlParts = typeof urlPartsShape.runtimeType;
