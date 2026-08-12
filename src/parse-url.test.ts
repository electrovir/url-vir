import {removeSuffix} from '@augment-vir/common';
import {describe, itCases} from '@augment-vir/test';
import {createHref, parseUrl} from './parse-url.js';
import {emptyUrlParts} from './url-parts.js';
import {mockUrlParts, mockUrlString} from './url-parts.mock.js';

describe(parseUrl.name, () => {
    itCases(parseUrl, [
        {
            it: 'handles empty string',
            inputs: [
                '',
            ],
            expect: emptyUrlParts,
        },
        {
            it: 'parses all parts',
            inputs: [
                mockUrlString,
            ],
            expect: mockUrlParts,
        },
        {
            it: 'handles a URL object',
            inputs: [
                new URL(mockUrlString),
            ],
            expect: mockUrlParts,
        },
        {
            it: 'works without login info',
            inputs: [
                'https://example.com:8765/path/1/2?hello=there&why#time-to-go',
            ],
            expect: {
                ...mockUrlParts,
                href: 'https://example.com:8765/path/1/2?hello=there&why#time-to-go',
                origin: 'https://example.com:8765',
                password: '',
                username: '',
            },
        },
        {
            it: 'works without port',
            inputs: [
                'https://user:pass@example.com/path/1/2?hello=there&why#time-to-go',
            ],
            expect: {
                ...mockUrlParts,
                host: 'example.com',
                href: 'https://user:pass@example.com/path/1/2?hello=there&why#time-to-go',
                origin: 'https://example.com',
                port: '',
            },
        },
        {
            it: 'parses all hostname domains',
            inputs: [
                'https://api.staging.example.com/path',
            ],
            expect: {
                ...emptyUrlParts,
                domains: [
                    'api',
                    'staging',
                    'example',
                    'com',
                ],
                fullPath: '/path',
                host: 'api.staging.example.com',
                hostname: 'api.staging.example.com',
                href: 'https://api.staging.example.com/path',
                origin: 'https://api.staging.example.com',
                pathname: '/path',
                paths: [
                    'path',
                ],
                protocol: 'https',
            },
        },
        {
            it: 'works without hash',
            inputs: [
                'https://user:pass@example.com:8765/path/1/2?hello=there&why',
            ],
            expect: {
                ...mockUrlParts,
                hash: '',
                href: 'https://user:pass@example.com:8765/path/1/2?hello=there&why',
                fullPath: '/path/1/2?hello=there&why',
            },
        },
        {
            it: 'works without search',
            inputs: [
                'https://user:pass@example.com:8765/path/1/2#time-to-go',
            ],
            expect: {
                ...mockUrlParts,
                href: 'https://user:pass@example.com:8765/path/1/2#time-to-go',
                search: '',
                searchParams: {},
                fullPath: '/path/1/2#time-to-go',
            },
        },
        {
            it: 'works without path',
            inputs: [
                'https://user:pass@example.com:8765?hello=there&why#time-to-go',
            ],
            expect: {
                ...mockUrlParts,
                href: 'https://user:pass@example.com:8765/?hello=there&why#time-to-go',
                paths: [],
                pathname: '/',
                fullPath: '/?hello=there&why#time-to-go',
            },
        },
        {
            it: 'works without protocol',
            inputs: [
                'user:pass@example.com:8765/path/1/2?hello=there&why#time-to-go',
            ],
            expect: {
                ...mockUrlParts,
                href: 'user:pass@example.com:8765/path/1/2?hello=there&why#time-to-go',
                origin: 'example.com:8765',
                protocol: '',
            },
        },
        {
            it: 'removes extraneous port colon',
            inputs: [
                'https://example.com:/path/1/2',
            ],
            expect: {
                hash: '',
                host: 'example.com',
                hostname: 'example.com',
                domains: [
                    'example',
                    'com',
                ],
                href: 'https://example.com/path/1/2',
                origin: 'https://example.com',
                password: '',
                pathname: '/path/1/2',
                paths: [
                    'path',
                    '1',
                    '2',
                ],
                fullPath: '/path/1/2',
                port: '',
                protocol: 'https',
                search: '',
                searchParams: {},
                username: '',
            },
        },
        {
            it: 'handles missing protocol with auth',
            inputs: [
                '://user:pass@example.com:8765/path/1/2?hello=there&why#time-to-go',
            ],
            expect: {
                ...mockUrlParts,
                href: 'user:pass@example.com:8765/path/1/2?hello=there&why#time-to-go',
                origin: 'example.com:8765',
                protocol: '',
            },
        },
        {
            it: 'parses an IPv6 url with a port',
            inputs: [
                'https://[::1]:3000/path',
            ],
            expect: {
                ...emptyUrlParts,
                fullPath: '/path',
                paths: ['path'],
                pathname: '/path',
                host: '[::1]:3000',
                hostname: '[::1]',
                domains: [
                    '[::1]',
                ],
                port: '3000',
                href: 'https://[::1]:3000/path',
                origin: 'https://[::1]:3000',
                protocol: 'https',
            },
        },
        {
            it: 'parses an IPv6 url without a port',
            inputs: [
                'https://[::1]/path',
            ],
            expect: {
                ...emptyUrlParts,
                fullPath: '/path',
                paths: ['path'],
                pathname: '/path',
                host: '[::1]',
                hostname: '[::1]',
                domains: [
                    '[::1]',
                ],
                href: 'https://[::1]/path',
                origin: 'https://[::1]',
                protocol: 'https',
            },
        },
        {
            it: 'parses a relative path',
            inputs: [
                './relative-path',
            ],
            expect: {
                fullPath: '/relative-path',
                hash: '',
                host: '',
                hostname: '',
                domains: [],
                href: '/relative-path',
                origin: '',
                password: '',
                pathname: '/relative-path',
                paths: [
                    'relative-path',
                ],
                port: '',
                protocol: '',
                search: '',
                searchParams: {},
                username: '',
            },
        },
        {
            it: 'handles invalid protocol separator with auth',
            inputs: [
                '//user:pass@example.com:8765/path/1/2?hello=there&why#time-to-go',
            ],
            expect: {
                ...mockUrlParts,
                href: 'user:pass@example.com:8765/path/1/2?hello=there&why#time-to-go',
                origin: 'example.com:8765',
                protocol: '',
            },
        },
        {
            it: 'handles slash in auth',
            inputs: [
                '/user:pass@example.com:8765/path/1/2?hello=there&why#time-to-go',
            ],
            expect: {
                ...mockUrlParts,
                href: 'user:pass@example.com:8765/path/1/2?hello=there&why#time-to-go',
                origin: 'example.com:8765',
                protocol: '',
            },
        },
        {
            it: 'handles colon in auth',
            inputs: [
                ':user:pass@example.com:8765/path/1/2?hello=there&why#time-to-go',
            ],
            expect: {
                ...mockUrlParts,
                href: 'user:pass@example.com:8765/path/1/2?hello=there&why#time-to-go',
                origin: 'example.com:8765',
                protocol: '',
            },
        },

        {
            it: 'handles missing protocol without auth',
            inputs: [
                '://example.com:8765/path/1/2?hello=there&why#time-to-go',
            ],
            expect: {
                ...mockUrlParts,
                href: 'example.com:8765/path/1/2?hello=there&why#time-to-go',
                origin: 'example.com:8765',
                protocol: '',
                password: '',
                username: '',
            },
        },
        {
            it: 'handles invalid protocol separator without auth',
            inputs: [
                '//example.com:8765/path/1/2?hello=there&why#time-to-go',
            ],
            expect: {
                ...mockUrlParts,
                host: '',
                hostname: '',
                domains: [],
                href: '/example.com:8765/path/1/2?hello=there&why#time-to-go',
                origin: '',
                password: '',
                pathname: '/example.com:8765/path/1/2',
                paths: [
                    'example.com:8765',
                    'path',
                    '1',
                    '2',
                ],
                fullPath: '/example.com:8765/path/1/2?hello=there&why#time-to-go',
                port: '',
                protocol: '',
                username: '',
            },
        },
        {
            it: 'handles slash in domain',
            inputs: [
                '/example.com:8765/path/1/2?hello=there&why#time-to-go',
            ],
            expect: {
                ...mockUrlParts,
                host: '',
                hostname: '',
                domains: [],
                href: '/example.com:8765/path/1/2?hello=there&why#time-to-go',
                origin: '',
                password: '',
                pathname: '/example.com:8765/path/1/2',
                paths: [
                    'example.com:8765',
                    'path',
                    '1',
                    '2',
                ],
                fullPath: '/example.com:8765/path/1/2?hello=there&why#time-to-go',
                port: '',
                protocol: '',
                username: '',
            },
        },
        {
            it: 'handles colon in domain',
            inputs: [
                ':example.com:8765/path/1/2?hello=there&why#time-to-go',
            ],
            expect: {
                ...mockUrlParts,
                host: ':example.com:8765',
                hostname: ':example.com',
                domains: [
                    ':example',
                    'com',
                ],
                href: ':example.com:8765/path/1/2?hello=there&why#time-to-go',
                origin: ':example.com:8765',
                password: '',
                port: '8765',
                protocol: '',
                username: '',
            },
        },
        {
            it: 'decodes percent-encoded password',
            inputs: [
                'https://user:abc%23xyz@example.com/path',
            ],
            expect: {
                ...emptyUrlParts,
                fullPath: '/path',
                host: 'example.com',
                hostname: 'example.com',
                domains: [
                    'example',
                    'com',
                ],
                href: 'https://user:abc%23xyz@example.com/path',
                origin: 'https://example.com',
                password: 'abc#xyz',
                pathname: '/path',
                paths: ['path'],
                protocol: 'https',
                username: 'user',
            },
        },
        {
            it: 'decodes percent-encoded username',
            inputs: [
                'https://user%40domain:pass@example.com/path',
            ],
            expect: {
                ...emptyUrlParts,
                fullPath: '/path',
                host: 'example.com',
                hostname: 'example.com',
                domains: [
                    'example',
                    'com',
                ],
                href: 'https://user%40domain:pass@example.com/path',
                origin: 'https://example.com',
                password: 'pass',
                pathname: '/path',
                paths: ['path'],
                protocol: 'https',
                username: 'user@domain',
            },
        },
        {
            it: 'handles a simple url',
            inputs: [
                'https://example.com',
            ],
            expect: {
                ...emptyUrlParts,
                host: 'example.com',
                hostname: 'example.com',
                domains: [
                    'example',
                    'com',
                ],
                href: 'https://example.com/',
                origin: 'https://example.com',
                protocol: 'https',
            },
        },
        {
            it: 'collapses two consecutive identical ports to the first',
            inputs: [
                'postgresql://user:pass@example.com:5432:5432/db',
            ],
            expect: {
                ...emptyUrlParts,
                fullPath: '/db',
                host: 'example.com:5432',
                hostname: 'example.com',
                domains: [
                    'example',
                    'com',
                ],
                href: 'postgresql://user:pass@example.com:5432/db',
                origin: 'postgresql://example.com:5432',
                password: 'pass',
                pathname: '/db',
                paths: [
                    'db',
                ],
                port: '5432',
                protocol: 'postgresql',
                username: 'user',
            },
        },
        {
            it: 'uses the first port when two different ports are stacked',
            inputs: [
                'postgresql://example.com:5432:6000/db',
            ],
            expect: {
                ...emptyUrlParts,
                fullPath: '/db',
                host: 'example.com:5432',
                hostname: 'example.com',
                domains: [
                    'example',
                    'com',
                ],
                href: 'postgresql://example.com:5432/db',
                origin: 'postgresql://example.com:5432',
                pathname: '/db',
                paths: [
                    'db',
                ],
                port: '5432',
                protocol: 'postgresql',
            },
        },
        {
            /**
             * A browser resolves the host from the _first_ `://`, so this navigates to `evil.com`,
             * not the `vendor.com` embedded later in the path. The parser must agree so a hostname
             * allow-list can't be fooled by an off-host suffix.
             */
            it: 'resolves the leading host when the path embeds another url',
            inputs: [
                'https://evil.com/x/https://vendor.com',
            ],
            expect: {
                ...emptyUrlParts,
                fullPath: '/x/https:/vendor.com',
                host: 'evil.com',
                hostname: 'evil.com',
                domains: [
                    'evil',
                    'com',
                ],
                href: 'https://evil.com/x/https:/vendor.com',
                origin: 'https://evil.com',
                pathname: '/x/https:/vendor.com',
                paths: [
                    'x',
                    'https:',
                    'vendor.com',
                ],
                protocol: 'https',
            },
        },
        {
            it: 'resolves the leading host even with login info before an embedded url',
            inputs: [
                'https://user:pass@evil.com/path/to/https://vendor.com',
            ],
            expect: {
                ...emptyUrlParts,
                fullPath: '/path/to/https:/vendor.com',
                host: 'evil.com',
                hostname: 'evil.com',
                domains: [
                    'evil',
                    'com',
                ],
                href: 'https://user:pass@evil.com/path/to/https:/vendor.com',
                origin: 'https://evil.com',
                password: 'pass',
                pathname: '/path/to/https:/vendor.com',
                paths: [
                    'path',
                    'to',
                    'https:',
                    'vendor.com',
                ],
                protocol: 'https',
                username: 'user',
            },
        },
        {
            /**
             * An `@` after the first path slash is path content, not userinfo, so the host is the
             * part before it (`vendor.com`), matching the browser — not the `evil.com` that
             * follows.
             */
            it: 'does not treat an @ in the path as userinfo',
            inputs: [
                'https://vendor.com/@evil.com/path',
            ],
            expect: {
                ...emptyUrlParts,
                fullPath: '/@evil.com/path',
                host: 'vendor.com',
                hostname: 'vendor.com',
                domains: [
                    'vendor',
                    'com',
                ],
                href: 'https://vendor.com/@evil.com/path',
                origin: 'https://vendor.com',
                pathname: '/@evil.com/path',
                paths: [
                    '@evil.com',
                    'path',
                ],
                protocol: 'https',
            },
        },
        {
            /**
             * For special schemes a browser treats backslashes as forward slashes, so this resolves
             * to `vendor.com` (with `/@evil.com/path`), not the `evil.com` that a naive parser
             * would read as the host after the `@`.
             */
            it: 'normalizes backslashes for a special scheme',
            inputs: [
                String.raw`https://vendor.com\@evil.com/path`,
            ],
            expect: {
                ...emptyUrlParts,
                fullPath: '/@evil.com/path',
                host: 'vendor.com',
                hostname: 'vendor.com',
                domains: [
                    'vendor',
                    'com',
                ],
                href: 'https://vendor.com/@evil.com/path',
                origin: 'https://vendor.com',
                pathname: '/@evil.com/path',
                paths: [
                    '@evil.com',
                    'path',
                ],
                protocol: 'https',
            },
        },
        {
            it: 'normalizes backslashes in the authority and path for a special scheme',
            inputs: [
                String.raw`https://a.com\b\c`,
            ],
            expect: {
                ...emptyUrlParts,
                fullPath: '/b/c',
                host: 'a.com',
                hostname: 'a.com',
                domains: [
                    'a',
                    'com',
                ],
                href: 'https://a.com/b/c',
                origin: 'https://a.com',
                pathname: '/b/c',
                paths: [
                    'b',
                    'c',
                ],
                protocol: 'https',
            },
        },
        {
            /** Consecutive slashes in the path are normalized away, leaving no empty path segments. */
            it: 'collapses repeated slashes within the path',
            inputs: [
                'https://a.com/x//y///z',
            ],
            expect: {
                ...emptyUrlParts,
                fullPath: '/x/y/z',
                host: 'a.com',
                hostname: 'a.com',
                domains: [
                    'a',
                    'com',
                ],
                href: 'https://a.com/x/y/z',
                origin: 'https://a.com',
                pathname: '/x/y/z',
                paths: [
                    'x',
                    'y',
                    'z',
                ],
                protocol: 'https',
            },
        },
        {
            /**
             * A `?` inside a query value is legitimate (e.g. an embedded redirect url). It must
             * stay in the search and not leak into the pathname or duplicate into the href.
             */
            it: 'keeps a query out of the pathname when a value contains a question mark',
            inputs: [
                'https://example.com/search?q=a?b',
            ],
            expect: {
                ...emptyUrlParts,
                fullPath: '/search?q=a?b',
                host: 'example.com',
                hostname: 'example.com',
                domains: [
                    'example',
                    'com',
                ],
                href: 'https://example.com/search?q=a?b',
                origin: 'https://example.com',
                pathname: '/search',
                paths: [
                    'search',
                ],
                protocol: 'https',
                search: '?q=a?b',
                searchParams: {
                    q: [
                        'a?b',
                    ],
                },
            },
        },
        {
            /** Everything after the first `#` is the fragment, even when more `#` follow. */
            it: 'keeps the fragment out of the pathname when the hash contains another hash',
            inputs: [
                'https://example.com/a#b#c',
            ],
            expect: {
                ...emptyUrlParts,
                fullPath: '/a#b#c',
                hash: '#b#c',
                host: 'example.com',
                hostname: 'example.com',
                domains: [
                    'example',
                    'com',
                ],
                href: 'https://example.com/a#b#c',
                origin: 'https://example.com',
                pathname: '/a',
                paths: [
                    'a',
                ],
                protocol: 'https',
            },
        },
        {
            it: 'parses a url with an embedded redirect url in a query param',
            inputs: [
                'https://example.com/p?redirect=https://x.com/y?z=1#frag',
            ],
            expect: {
                ...emptyUrlParts,
                fullPath: '/p?redirect=https://x.com/y?z=1#frag',
                hash: '#frag',
                host: 'example.com',
                hostname: 'example.com',
                domains: [
                    'example',
                    'com',
                ],
                href: 'https://example.com/p?redirect=https://x.com/y?z=1#frag',
                origin: 'https://example.com',
                pathname: '/p',
                paths: [
                    'p',
                ],
                protocol: 'https',
                search: '?redirect=https://x.com/y?z=1',
                searchParams: {
                    redirect: [
                        'https://x.com/y?z=1',
                    ],
                },
            },
        },
        {
            it: 'handles example url',
            inputs: [
                'https://example.com:123/hello/there',
            ],
            expect: {
                protocol: 'https',
                username: '',
                password: '',
                host: 'example.com:123',
                hostname: 'example.com',
                domains: [
                    'example',
                    'com',
                ],
                port: '123',
                origin: 'https://example.com:123',
                pathname: '/hello/there',
                paths: [
                    'hello',
                    'there',
                ],
                search: '',
                searchParams: {},
                hash: '',
                fullPath: '/hello/there',
                href: 'https://example.com:123/hello/there',
            },
        },
    ]);
});

/**
 * Cross-checks `parseUrl` against the built-in `URL` constructor (what a browser actually uses to
 * navigate) for the fields that decide _which host is contacted_: protocol, userinfo, hostname,
 * port, host, and origin. This is the security-critical guarantee — an allow-list built on any of
 * these can't be fooled — and it holds for every tricky input (embedded `://`, backslashes, an `@`
 * in the path, repeated slashes). The pathname is intentionally not compared here: `parseUrl`
 * normalizes consecutive slashes away, which a browser does not. Inputs use plain ASCII userinfo so
 * the browser's percent-encoded `username`/`password` match `parseUrl`'s decoded values.
 */
describe('parseUrl resolves the same host as the browser', () => {
    function parsedHost(url: string) {
        const {host, hostname, origin, password, port, protocol, username} = parseUrl(url);
        return {
            host,
            hostname,
            origin,
            password,
            port,
            protocol,
            username,
        };
    }

    function browserHost(url: string) {
        const parsed = new URL(url);
        return {
            host: parsed.host,
            hostname: parsed.hostname,
            origin: parsed.origin,
            password: parsed.password,
            port: parsed.port,
            /** `URL.protocol` includes a trailing colon (e.g. `https:`); `parseUrl` omits it. */
            protocol: removeSuffix({
                value: parsed.protocol,
                suffix: ':',
            }),
            username: parsed.username,
        };
    }

    itCases(
        parsedHost,
        [
            'https://evil.com/x/https://vendor.com',
            'https://user:pass@evil.com/path/to/https://vendor.com',
            'https://sub.example.com:8080/a/https://b.com/c',
            'https://[::1]:3000/x/https://vendor.com',
            'https://vendor.com/@evil.com/path',
            String.raw`https://vendor.com\@evil.com/path`,
            String.raw`https://a.com\b\c`,
            'https://a.com/x//y///z',
            'https://a.com//b',
            'https://example.com/search?q=a?b',
            'https://example.com/a#b#c',
            'https://example.com/p?redirect=https://x.com/y?z=1#frag',
            'https://example.com/p?a=1#frag',
            'http://example.com/normal/path',
        ].map((url) => {
            return {
                it: `resolves the same host as the browser for ${url}`,
                input: url,
                expect: browserHost(url),
            };
        }),
    );
});

describe(createHref.name, () => {
    itCases(createHref, [
        {
            it: 'handles all empty',
            input: {
                hash: '',
                hostname: '',
                port: '',
                password: '',
                pathname: '',
                protocol: '',
                search: '',
                username: '',
            },
            expect: '/',
        },
        {
            it: 'handles all parts',
            input: {
                hash: '#hello',
                hostname: 'example.com',
                port: '8765',
                password: 'pass',
                pathname: '/path/1/2',
                protocol: 'https',
                search: '?hello=there',
                username: 'user',
            },
            expect: 'https://user:pass@example.com:8765/path/1/2?hello=there#hello',
        },
        {
            it: 'handles invalid search',
            input: {
                hash: '#hello',
                hostname: 'example.com',
                port: '8765',
                password: 'pass',
                pathname: '/path/1/2',
                protocol: 'https',
                search: 'hello=there',
                username: 'user',
            },
            expect: 'https://user:pass@example.com:8765/path/1/2?hello=there#hello',
        },
        {
            it: 'handles invalid hash',
            input: {
                hash: 'hello',
                hostname: 'example.com',
                port: '8765',
                password: 'pass',
                pathname: '/path/1/2',
                protocol: 'https',
                search: '?hello=there',
                username: 'user',
            },
            expect: 'https://user:pass@example.com:8765/path/1/2?hello=there#hello',
        },
        {
            it: 'omits missing auth',
            input: {
                hash: '#hello',
                hostname: 'example.com',
                port: '8765',
                password: '',
                pathname: '/path/1/2',
                protocol: 'https',
                search: '?hello=there',
                username: '',
            },
            expect: 'https://example.com:8765/path/1/2?hello=there#hello',
        },
        {
            it: 'omits missing protocol',
            input: {
                hash: '#hello',
                hostname: 'example.com',
                port: '8765',
                password: 'pass',
                pathname: '/path/1/2',
                protocol: '',
                search: '?hello=there',
                username: 'user',
            },
            expect: 'user:pass@example.com:8765/path/1/2?hello=there#hello',
        },
        {
            it: 'handles invalid pathname',
            input: {
                hash: '#hello',
                hostname: 'example.com',
                port: '8765',
                password: 'pass',
                pathname: 'path/1/2',
                protocol: 'https',
                search: '?hello=there',
                username: 'user',
            },
            expect: 'https://user:pass@example.com:8765/path/1/2?hello=there#hello',
        },
        {
            it: 'handles an absolute path',
            input: {
                hash: '',
                hostname: '',
                port: '',
                password: '',
                pathname: 'path/1/2',
                protocol: '',
                search: '?hello=there',
                username: '',
            },
            expect: '/path/1/2?hello=there',
        },
        {
            it: 'encodes special characters in password',
            input: {
                hash: '',
                hostname: 'example.com',
                port: '',
                password: 'abc#xyz',
                pathname: '/',
                protocol: 'https',
                search: '',
                username: 'user',
            },
            expect: 'https://user:abc%23xyz@example.com/',
        },
        {
            it: 'encodes special characters in username',
            input: {
                hash: '',
                hostname: 'example.com',
                port: '',
                password: 'pass',
                pathname: '/',
                protocol: 'https',
                search: '',
                username: 'user@domain',
            },
            expect: 'https://user%40domain:pass@example.com/',
        },
    ]);
});
