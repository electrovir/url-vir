import {check} from '@augment-vir/assert';
import {addPrefix, removePrefix} from '@augment-vir/common';
import {searchParamsToObject} from './search-params.js';
import {UrlOptions, codeValue} from './url-options.js';
import {UrlParts} from './url-parts.js';

/**
 * Combined the needed URL parts into a URL's full href.
 *
 * @category Internal
 */
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
        createFullPath({hash, pathname, search}),
    ].join('');
}

/**
 * Split `pathname` into `paths`.
 *
 * @category Internal
 */
export function createPaths({pathname}: Readonly<Pick<UrlParts, 'pathname'>>) {
    const relativePath = removePrefix({value: pathname, prefix: '/'});
    return relativePath ? relativePath.split('/') : [];
}

/**
 * Combined the needed URL parts into a URL's `fullPath`.
 *
 * @category Internal
 */
export function createFullPath({
    hash,
    pathname,
    search,
}: Readonly<Pick<UrlParts, 'hash' | 'pathname' | 'search'>>) {
    return [
        addPrefix({value: pathname, prefix: '/'}),
        search ? addPrefix({value: search, prefix: '?'}) : '',
        hash ? addPrefix({value: hash, prefix: '#'}) : '',
    ].join('');
}

/**
 * Combined the needed URL parts into a URL host.
 *
 * @category Internal
 */
export function createHost({
    hostname,
    port,
}: Readonly<Pick<UrlParts, 'hostname' | 'port'>>): string {
    return [
        hostname,
        port ? ':' + port : '',
    ].join('');
}

/**
 * Combined the needed URL parts into a URL origin.
 *
 * @category Internal
 */
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
        .filter(check.isTruthy)
        .join('://');
}

/**
 * Converts a string or `URL` instance into {@link UrlParts}.
 *
 * - Partial URLs are valid. Whatever you don't provide will be empty in the returned object.
 * - Encoding options are only applied to pathname, search, and hash url parts.
 *
 * @category Main
 * @example
 *
 * ```ts
 * import {parseUrl} from 'url-vir';
 *
 * let result = parseUrl('https://example.com:123/hello/there');
 *
 * // output
 * result = {
 *     protocol: 'https',
 *     username: '',
 *     password: '',
 *     host: 'example.com:123',
 *     hostname: 'example.com',
 *     port: '123',
 *     origin: 'https://example.com:123',
 *     pathname: '/hello/there',
 *     paths: [
 *         'hello',
 *         'there',
 *     ],
 *     search: '',
 *     searchParams: {},
 *     hash: '',
 *     fullPath: '/hello/there',
 *     href: 'https://example.com:123/hello/there',
 * };
 * ```
 */
export function parseUrl(
    url: string | URL,
    options?: Readonly<Pick<UrlOptions, 'encoding'>> | undefined,
): UrlParts {
    const urlString = check.isString(url) ? url : url.toString();

    const rawHash = urlString.replace(/^[^#]*(?:#|$)/, '');
    const hash = rawHash ? addPrefix({value: codeValue(rawHash, options), prefix: '#'}) : '';
    const withoutHash = urlString.replace(/#[^#]*$/, '');

    const rawSearch = withoutHash.replace(/^[^?]*(?:\?|$)/, '');
    const search = rawSearch ? addPrefix({value: codeValue(rawSearch, options), prefix: '?'}) : '';
    const withoutSearch = withoutHash.replace(/\?[^?]*$/, '');

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
    const username = rawUsernameParts.toReversed().join('').replace(/[/:]/g, '') || '';
    const password = rawPassword?.replace(/[/:]/g, '') || '';

    const hostname = withoutLogin.replace(/[:/].*/, '');
    const withoutHost = withoutLogin.replace(/^[^/:]*(:|\/|$)/, '$1');

    const port = removePrefix({value: withoutHost.replace(/\/.*/, ''), prefix: ':'});

    const pathname = codeValue(withoutHost.replace(/^[^/]*(?:\/|$)/, '/'), options);

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
    const paths = createPaths({pathname});

    return {
        fullPath: createFullPath({hash, pathname, search}),
        hash,
        host,
        hostname,
        href,
        origin,
        password,
        pathname,
        paths,
        port,
        protocol,
        search,
        searchParams,
        username,
    };
}
