import {addPrefix, isTruthy, removePrefix} from '@augment-vir/common';
import {isRunTimeType} from 'run-time-assertions';
import {searchParamsToObject} from './search-params';
import {UrlOptions, codeValue} from './url-options';
import {UrlParts} from './url-parts';

/** Combined the needed URL parts into a URL's full href. */
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

/** Split `pathname` into `paths`. */
export function createPaths({pathname}: Readonly<Pick<UrlParts, 'pathname'>>) {
    const relativePath = removePrefix({value: pathname, prefix: '/'});
    return relativePath ? relativePath.split('/') : [];
}

/** Combined the needed URL parts into a URL's `fullPath`. */
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

/** Combined the needed URL parts into a URL host. */
export function createHost({
    hostname,
    port,
}: Readonly<Pick<UrlParts, 'hostname' | 'port'>>): string {
    return [
        hostname,
        port ? ':' + port : '',
    ].join('');
}

/** Combined the needed URL parts into a URL origin. */
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
