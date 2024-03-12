import {
    PartialAndUndefined,
    addPrefix,
    copyThroughJson,
    isTruthy,
    mapObjectValues,
    removePrefix,
    typedHasProperty,
} from '@augment-vir/common';
import {defineShape} from 'object-shape-tester';
import {isRunTimeType} from 'run-time-assertions';
import {ReadonlyObjectDeep} from 'type-fest/source/readonly-deep';
import {
    SearchParams,
    SearchParamsInput,
    combineSearchParams,
    searchParamsShape,
    searchParamsToObject,
    searchParamsToString,
} from './search-params';
import {UrlOptions, codeValue} from './url-options';

/** Shape definition for `UrlParts`. */
export const urlPartsShape = defineShape({
    /** Everything after the hash (#). If none exist, this will be an empty string. */
    hash: '',
    /**
     * An object representation of the parameters contained within the search string. If none exist,
     * it will be an empty object.
     */
    searchParams: searchParamsShape,

    /** The full url string. */
    href: '/',
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
    /**
     * Everything after a ?, excluding the hash, as a string. If none exist, this will be an empty
     * string.
     */
    search: '',
    /** Http, https, wss, etc. */
    protocol: '',
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
});

/** An example of empty `UrlParts` for convenience's sake. */
export const emptyUrlParts = {
    ...urlPartsShape.defaultValue,
    searchParams: {},
} as const satisfies UrlParts;

/**
 * The output of `buildUrl`. See its docs for more details.
 *
 * @category Primary Exports
 */
export type UrlParts = typeof urlPartsShape.runTimeType;

/** Overrides input for `buildUrl`. */
export type UrlOverrides = PartialAndUndefined<{
    hash?: string;
    search?: string | SearchParamsInput;
    hostname?: string;
    pathname?: string;
    protocol?: string;
    username?: string;
    password?: string;
    port?: string | number;
}>;

/**
 * Build a URL straight from overrides.
 *
 * @category Primary Exports
 * @returns `UrlParts`, an object similar to the global `URL` class, but with some differences:
 *
 *   - `searchParams` is an object rather than an instance of `URLSearchParams`.
 *   - Search param values are not automatically encoded.
 */
export function buildUrl(
    override: ReadonlyObjectDeep<UrlOverrides>,
    options?: Readonly<UrlOptions> | undefined,
): UrlParts;
/**
 * Build a URL by overriding an existing base URL string.
 *
 * @category Primary Exports
 * @returns `UrlParts`, an object similar to the global `URL` class, but with some differences:
 *
 *   - `searchParams` is an object rather than an instance of `URLSearchParams`.
 *   - Search param values are not automatically encoded.
 */
export function buildUrl(
    baseString: string,
    override: ReadonlyObjectDeep<UrlOverrides>,
    options?: ReadonlyObjectDeep<UrlOptions> | undefined,
): UrlParts;
/**
 * @category Primary Exports
 * @returns `UrlParts`, an object similar to the global `URL` class, but with some differences:
 *
 *   - `searchParams` is an object rather than an instance of `URLSearchParams`.
 *   - Search param values are not automatically encoded.
 */
export function buildUrl(
    baseStringOrOverride: string | ReadonlyObjectDeep<UrlOverrides>,
    overrideOrOptions?:
        | ReadonlyObjectDeep<UrlOverrides>
        | ReadonlyObjectDeep<UrlOptions>
        | undefined,
    maybeOptions?: ReadonlyObjectDeep<UrlOptions> | undefined,
): UrlParts {
    const baseString: string = isRunTimeType(baseStringOrOverride, 'string')
        ? baseStringOrOverride
        : '';
    const override: ReadonlyObjectDeep<UrlOverrides> = isRunTimeType(baseStringOrOverride, 'string')
        ? (overrideOrOptions as Readonly<UrlOverrides>)
        : baseStringOrOverride;
    const options: ReadonlyObjectDeep<UrlOptions> | undefined = isRunTimeType(
        baseStringOrOverride,
        'string',
    )
        ? maybeOptions
        : (overrideOrOptions as Readonly<UrlOptions> | undefined);

    const initUrlParts = parseUrl(baseString);

    const baseUrlParts = mapObjectValues(
        initUrlParts,
        (key, baseValue): string | SearchParamsInput => {
            if (!typedHasProperty(override, key)) {
                return baseValue;
            }

            const initPart = override[key];

            if (isRunTimeType(initPart, 'number')) {
                return String(initPart);
            } else if (isRunTimeType(initPart, 'string')) {
                if (key === 'hash' && initPart) {
                    return addPrefix({value: initPart, prefix: '#'});
                } else if (key === 'pathname') {
                    return addPrefix({value: initPart, prefix: '/'});
                } else {
                    return initPart;
                }
            } else {
                return baseValue;
            }
        },
    ) as Record<keyof UrlParts, string | SearchParams> as UrlParts;

    const initSearchParams: SearchParams = isRunTimeType(override.search, 'string')
        ? searchParamsToObject(addPrefix({value: override.search, prefix: '?'}))
        : copyThroughJson((override.search || {}) as SearchParams);

    const searchParams = combineSearchParams(baseUrlParts.searchParams, initSearchParams, options);

    const search = searchParamsToString(searchParams, options);

    const joinedParts: UrlParts = {
        ...baseUrlParts,
        searchParams,
        search,
        host: createHost(baseUrlParts),
        origin: createOrigin(baseUrlParts),
        href: createHref({
            ...baseUrlParts,
            search,
        }),
    };

    return joinedParts;
}

/** Combined the needed url parts into a URL's full href. */
export function createHref({
    hash,
    hostname,
    password,
    pathname,
    port,
    protocol,
    search,
    username,
}: Readonly<
    Pick<
        UrlParts,
        'protocol' | 'username' | 'password' | 'hostname' | 'port' | 'hash' | 'pathname' | 'search'
    >
>): string {
    return [
        protocol ? protocol + '://' : '',
        username ? username + ':' : '',
        password ? password + '@' : '',
        createHost({hostname, port}),
        addPrefix({value: pathname, prefix: '/'}),
        search ? addPrefix({value: search, prefix: '?'}) : '',
        hash ? addPrefix({value: hash, prefix: '#'}) : '',
    ].join('');
}

/** Combined the needed url parts into a URL host. */
export function createHost({
    hostname,
    port,
}: Readonly<Pick<UrlParts, 'hostname' | 'port'>>): string {
    return [
        hostname,
        port ? ':' + port : '',
    ].join('');
}

/** Combined the needed url parts into a URL origin. */
export function createOrigin({
    hostname,
    port,
    protocol,
}: Readonly<Pick<UrlParts, 'hostname' | 'port' | 'protocol'>>): string {
    return [
        protocol,
        createHost({
            hostname,
            port,
        }),
    ]
        .filter(isTruthy)
        .join('://');
}

/**
 * Converts a string or `URL` instance into `UrlParts`.
 *
 * - Partial URLs are valid. Whatever you don't provide will be empty in the returned object.
 * - Encoding options are only applied to pathname, search, and hash url parts.
 *
 * @category Primary Exports
 */
export function parseUrl(
    url: string | URL,
    options?: Readonly<Pick<UrlOptions, 'encoding'>> | undefined,
): UrlParts {
    const urlString = isRunTimeType(url, 'string') ? url : url.toString();

    const rawHash = urlString.replace(/^[^#]*(?:#|$)/, '');
    const hash = rawHash ? addPrefix({value: codeValue(rawHash, options), prefix: '#'}) : '';
    const withoutHash = urlString.replace(/#.*$/, '');

    const rawSearch = withoutHash.replace(/^[^\?]*(?:\?|$)/, '');
    const search = rawSearch ? addPrefix({value: codeValue(rawSearch, options), prefix: '?'}) : '';
    const withoutSearch = withoutHash.replace(/\?.*$/, '');

    const protocol = withoutSearch.includes('://') ? withoutSearch.replace(/:\/\/.*$/, '') : '';
    const withoutProtocol = withoutSearch
        .replace(/^.*:\/\//, '')
        /** Remove duplicate consecutive slashes. */
        .replace(/\/\//g, '/');
    const login = withoutProtocol.replace(/@.*/, '');
    const withoutLogin = withoutProtocol.replace(/^[^@]*@/, '');
    const hasLogin = login !== withoutLogin;
    const [
        rawPassword,
        ...rawUsernameParts
    ] = hasLogin ? login.split(':').reverse() : [];
    const username = rawUsernameParts.reverse().join('').replace(/[\/:]/g, '') || '';
    const password = rawPassword?.replace(/[\/:]/g, '') || '';

    const hostname = withoutLogin.replace(/[:\/].*/, '');
    const withoutHost = withoutLogin.replace(/^[^\/:]*(\:|\/|$)/, '$1');

    const port = removePrefix({value: withoutHost.replace(/\/.*$/, ''), prefix: ':'});

    const pathname = codeValue(withoutHost.replace(/^[^\/]*(?:\/|$)/, '/'), options);

    const host = createHost({hostname, port});

    const origin = createOrigin({hostname, port, protocol});

    const href = createHref({
        hash,
        hostname,
        password,
        pathname,
        port,
        protocol,
        search,
        username,
    });

    const searchParams = searchParamsToObject(search);

    return {
        hash,
        host,
        hostname,
        href,
        origin,
        password,
        pathname,
        port,
        protocol,
        search,
        searchParams,
        username,
    };
}
