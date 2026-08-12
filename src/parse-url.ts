import {check} from '@augment-vir/assert';
import {addPrefix, removePrefix, splitIncludeSplit} from '@augment-vir/common';
import {searchParamsToObject} from './search-params.js';
import {type UrlOptions, codeValue} from './url-options.js';
import {type UrlParts} from './url-parts.js';

/**
 * Schemes that browsers treat as "special": within these, a backslash is equivalent to a forward
 * slash in the scheme, authority, and path (but not the query or fragment).
 */
const specialSchemes = [
    'ftp',
    'file',
    'http',
    'https',
    'ws',
    'wss',
];

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
        username ? encodeURIComponent(username) + ':' : '',
        password ? encodeURIComponent(password) + '@' : '',
        createHost({
            hostname,
            port,
        }),
        createFullPath({
            hash,
            pathname,
            search,
        }),
    ].join('');
}

/**
 * Split `pathname` into `paths`.
 *
 * @category Internal
 */
export function createPaths({pathname}: Readonly<Pick<UrlParts, 'pathname'>>) {
    const relativePath = removePrefix({
        value: pathname,
        prefix: '/',
    });
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
        addPrefix({
            value: pathname,
            prefix: '/',
        }),
        search
            ? addPrefix({
                  value: search,
                  prefix: '?',
              })
            : '',
        hash
            ? addPrefix({
                  value: hash,
                  prefix: '#',
              })
            : '',
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
 * Split `hostname` into its dot-separated domains.
 *
 * @category Internal
 */
export function createDomains({hostname}: Readonly<Pick<UrlParts, 'hostname'>>) {
    return hostname ? hostname.split('.') : [];
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
 *     domains: [
 *         'example',
 *         'com',
 *     ],
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
    const urlString = check.isString(url)
        ? removePrefix({
              value: url,
              prefix: '.',
          })
        : url.toString();

    const rawHash = urlString.replace(/^[^#]*(?:#|$)/, '');
    const hash = rawHash
        ? addPrefix({
              value: codeValue(rawHash, options),
              prefix: '#',
          })
        : '';
    /**
     * Strip from the _first_ `#`, matching how `rawHash` above extracts everything after the first
     * `#`. Stripping from the last `#` instead would leak an earlier `#...#` segment into the
     * pathname when a URL contains more than one `#`.
     */
    const hashIndex = urlString.indexOf('#');
    const withoutHash = hashIndex === -1 ? urlString : urlString.slice(0, hashIndex);

    const rawSearch = withoutHash.replace(/^[^?]*(?:\?|$)/, '');
    const search = rawSearch
        ? addPrefix({
              value: codeValue(rawSearch, options),
              prefix: '?',
          })
        : '';
    /**
     * Strip from the _first_ `?`, matching how `rawSearch` above extracts everything after the
     * first `?`. Stripping from the last `?` instead would leak the query into the pathname when a
     * query value itself contains a `?` (e.g. `?redirect=a?b`), producing a doubled `href`.
     */
    const searchIndex = withoutHash.indexOf('?');
    const withoutSearch = searchIndex === -1 ? withoutHash : withoutHash.slice(0, searchIndex);

    const protocol = withoutSearch.includes('://') ? withoutSearch.replace(/:\/\/.*$/, '') : '';
    /**
     * For a "special" scheme, browsers treat backslashes as forward slashes in the scheme,
     * authority, and path (the query and fragment, already removed above, are left alone). Matching
     * that prevents host confusion like `https://vendor.com\@evil.com` resolving to `evil.com`
     * instead of the browser's `vendor.com`.
     */
    const cleanedWithoutSearch = specialSchemes.includes(protocol.toLowerCase())
        ? withoutSearch.replace(/\\/g, '/')
        : withoutSearch;
    const withoutProtocol = cleanedWithoutSearch
        /**
         * Strip only up to the _first_ `://` (note the lazy `.*?`). A browser resolves the host
         * from the first `://`, so a URL with another `://` embedded in its path (e.g.
         * `https://evil.com/x/https://vendor.com`) navigates to `evil.com`, not the trailing host.
         * A greedy `.*` here would strip up to the last `://` and resolve the wrong host, which
         * would let an off-host link slip past a hostname allow-list.
         */
        .replace(/^.*?:\/\//, '')
        /**
         * Collapse every run of consecutive slashes to a single slash. This normalizes away empty
         * path segments (so `paths` never contains `''`) and keeps protocol-relative input
         * (`//example.com/path`) parsing as a path.
         */
        .replace(/\/{2,}/g, '/');
    /**
     * Userinfo (`user:pass@`) is only recognized within the authority — the part before the first
     * `/`. An `@` later in the path (e.g. `https://host.com/@handle`) is path content, not a login
     * separator, so it must not shift which host is resolved.
     */
    const authority = withoutProtocol.replace(/^\/*/, '').replace(/\/.*/, '');
    const hasLogin = authority.includes('@');
    const login = hasLogin ? withoutProtocol.replace(/@.*/, '') : '';
    const withoutLogin = hasLogin ? withoutProtocol.replace(/^[^@]*@/, '') : withoutProtocol;
    const [
        rawPassword,
        ...rawUsernameParts
    ] = hasLogin ? login.split(':').reverse() : [];
    const username = decodeURIComponent(
        rawUsernameParts.toReversed().join('').replace(/[/:]/g, '') || '',
    );
    const password = decodeURIComponent(rawPassword?.replace(/[/:]/g, '') || '');

    const maybePort = splitIncludeSplit(withoutLogin.replace(/\/.*/, ''), ':', {
        caseSensitive: true,
    }).toReversed();
    const trailingPort = maybePort[0]?.endsWith(']')
        ? ''
        : maybePort[1] === ':'
          ? maybePort[0] || ''
          : '';
    const withoutPort = withoutLogin.replace(new RegExp(`:${trailingPort}($|/)`), '$1');

    const rawHostname = withoutPort.replace(/\/.*/, '');

    /**
     * If the hostname still contains an embedded `:<digits>` suffix, that's a "first port" baked
     * into the host string (e.g. `example.com:5432:5432`). Per the parser's contract, the first
     * port wins: strip it from the hostname and use it as the port instead.
     */
    const embeddedPortMatch = rawHostname.endsWith(']')
        ? undefined
        : rawHostname.match(/^(?<host>.*):(?<port>\d+)$/);
    const hostname = embeddedPortMatch?.groups?.host ?? rawHostname;
    const domains = createDomains({
        hostname,
    });
    const port = embeddedPortMatch?.groups?.port ?? trailingPort;
    const withoutHost = withoutLogin.replace(/^[^/]*(\/|$)/, '$1');

    const pathname = codeValue(withoutHost.replace(/^[^/]*(?:\/|$)/, '/'), options);

    const host = createHost({
        hostname,
        port,
    });

    const origin = createOrigin({
        hostname,
        port,
        protocol,
    });

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
    const paths = createPaths({
        pathname,
    });

    return {
        fullPath: createFullPath({
            hash,
            pathname,
            search,
        }),
        hash,
        host,
        hostname,
        domains,
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
