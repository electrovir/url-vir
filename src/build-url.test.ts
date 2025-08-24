import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {buildUrl, type UrlOverrides} from './build-url.js';
import {parseUrl} from './parse-url.js';
import {SearchParamStrategy, UrlEncoding} from './url-options.js';
import {emptyUrlParts, type UrlParts} from './url-parts.js';
import {mockUrlParts, mockUrlString} from './url-parts.mock.js';

describe('UrlOverrides', () => {
    it('is assignable to from UrlParts', () => {
        const testAssignment: Readonly<UrlOverrides> = {} as Readonly<UrlParts>;
    });
});

describe(buildUrl.name, () => {
    itCases(buildUrl, [
        {
            it: 'adds an invalid hash',
            inputs: [
                '',
                {
                    hash: 'hello',
                },
            ],
            expect: {
                ...emptyUrlParts,
                hash: '#hello',
                href: '/#hello',
                fullPath: '/#hello',
            },
        },
        {
            it: 'adds an invalid search string',
            inputs: [
                '',
                {
                    search: 'derp=hi',
                },
            ],
            expect: {
                ...emptyUrlParts,
                search: '?derp=hi',
                searchParams: {
                    derp: ['hi'],
                },
                href: '/?derp=hi',
                fullPath: '/?derp=hi',
            },
        },
        {
            it: 'adds a valid hash',
            inputs: [
                '',
                {
                    hash: '#hello',
                },
            ],
            expect: {
                ...emptyUrlParts,
                hash: '#hello',
                href: '/#hello',
                fullPath: '/#hello',
            },
        },
        {
            it: 'adds a valid search string',
            inputs: [
                '',
                {
                    search: '?derp=hi',
                },
            ],
            expect: {
                ...emptyUrlParts,
                search: '?derp=hi',
                searchParams: {
                    derp: ['hi'],
                },
                href: '/?derp=hi',
                fullPath: '/?derp=hi',
            },
        },
        {
            it: 'adds a numeric port number',
            inputs: [
                'https://example.com',
                {
                    port: 9786,
                },
            ],
            expect: {
                ...emptyUrlParts,
                host: 'example.com:9786',
                hostname: 'example.com',
                port: '9786',
                origin: 'https://example.com:9786',
                href: 'https://example.com:9786/',
                protocol: 'https',
            },
        },
        {
            it: 'adds a path',
            inputs: [
                'https://example.com',
                {
                    pathname: 'no-slash',
                },
            ],
            expect: {
                ...emptyUrlParts,
                host: 'example.com',
                hostname: 'example.com',
                origin: 'https://example.com',
                href: 'https://example.com/no-slash',
                protocol: 'https',
                pathname: '/no-slash',
                paths: ['no-slash'],
                fullPath: '/no-slash',
            },
        },
        {
            it: 'adds paths',
            inputs: [
                'https://example.com',
                {
                    paths: ['new-path'],
                },
            ],
            expect: {
                ...emptyUrlParts,
                fullPath: '/new-path',
                paths: ['new-path'],
                host: 'example.com',
                hostname: 'example.com',
                origin: 'https://example.com',
                href: 'https://example.com/new-path',
                protocol: 'https',
                pathname: '/new-path',
            },
        },
        {
            it: 'adds search params',
            inputs: [
                '',
                {
                    search: {
                        derp: 'hi',
                    },
                },
            ],
            expect: {
                ...emptyUrlParts,
                search: '?derp=hi',
                searchParams: {
                    derp: ['hi'],
                },
                href: '/?derp=hi',
            },
        },
        {
            it: 'adds search params',
            inputs: [
                '',
                {
                    search: {
                        derp: 'hi',
                    },
                },
            ],
            expect: {
                ...emptyUrlParts,
                search: '?derp=hi',
                searchParams: {
                    derp: ['hi'],
                },
                href: '/?derp=hi',
            },
        },
        {
            it: 'works with a URL object input',
            inputs: [
                new URL('https://example.com'),
                {
                    search: {
                        derp: 'hi',
                    },
                },
            ],
            expect: {
                protocol: 'https',
                username: '',
                password: '',
                host: 'example.com',
                hostname: 'example.com',
                port: '',
                origin: 'https://example.com',
                pathname: '/',
                paths: [],
                hash: '',
                fullPath: '/',
                search: '?derp=hi',
                searchParams: {
                    derp: ['hi'],
                },
                href: 'https://example.com/?derp=hi',
            },
        },
        {
            it: 'adds search params to an existing url',
            inputs: [
                mockUrlString,
                {
                    search: {
                        derp: 'hi',
                    },
                },
            ],
            expect: {
                ...mockUrlParts,
                search: '?hello=there&why&derp=hi',
                searchParams: {
                    derp: ['hi'],
                    hello: ['there'],
                    why: [],
                },
                href: 'https://user:pass@example.com:8765/path/1/2?hello=there&why&derp=hi#time-to-go',
            },
        },
        {
            it: 'does not encode twice',
            inputs: [
                mockUrlString,
                {
                    search: {
                        something: '+4',
                    },
                },
                {
                    encoding: UrlEncoding.Encode,
                    searchParamStrategy: SearchParamStrategy.Clear,
                },
            ],
            expect: {
                ...mockUrlParts,
                search: '?something=%2B4',
                searchParams: {
                    something: ['+4'],
                },
                href: 'https://user:pass@example.com:8765/path/1/2?something=%2B4#time-to-go',
            },
        },
        {
            it: 'overwrites an existing domain',
            inputs: [
                mockUrlString,
                {
                    hostname: 'github.com',
                },
            ],
            expect: {
                ...mockUrlParts,
                hostname: 'github.com',
                origin: 'https://github.com:8765',
                host: 'github.com:8765',
                href: 'https://user:pass@github.com:8765/path/1/2?hello=there&why#time-to-go',
            },
        },
        {
            it: 'can overwrite url parts',
            inputs: [
                parseUrl(mockUrlString),
                {
                    hostname: 'github.com',
                },
            ],
            expect: {
                ...mockUrlParts,
                hostname: 'github.com',
                origin: 'https://github.com:8765',
                host: 'github.com:8765',
                href: 'https://user:pass@github.com:8765/path/1/2?hello=there&why#time-to-go',
            },
        },
        {
            it: 'merges an absolute path',
            inputs: [
                'example.com/path/',
                '/absolute-path',
            ],
            expect: {
                fullPath: '/absolute-path',
                hash: '',
                host: 'example.com',
                hostname: 'example.com',
                href: 'example.com/absolute-path',
                origin: 'example.com',
                password: '',
                pathname: '/absolute-path',
                paths: [
                    'absolute-path',
                ],
                port: '',
                protocol: '',
                search: '',
                searchParams: {},
                username: '',
            },
        },
        {
            it: 'merges a relative path',
            inputs: [
                'example.com/path?something=hi',
                './relative-path',
            ],
            expect: {
                fullPath: '/path/relative-path?something=hi',
                hash: '',
                host: 'example.com',
                hostname: 'example.com',
                href: 'example.com/path/relative-path?something=hi',
                origin: 'example.com',
                password: '',
                pathname: '/path/relative-path',
                paths: [
                    'path',
                    'relative-path',
                ],
                port: '',
                protocol: '',
                search: '?something=hi',
                searchParams: {
                    something: ['hi'],
                },
                username: '',
            },
        },
        {
            it: 'works with IPv6',
            inputs: [
                'https://[::1]:3000',
                {
                    paths: [
                        'hi',
                        'bye',
                    ],
                },
            ],
            expect: {
                fullPath: '/hi/bye',
                hash: '',
                password: '',
                pathname: '/hi/bye',
                paths: [
                    'hi',
                    'bye',
                ],
                port: '3000',
                protocol: 'https',
                search: '',
                searchParams: {},
                username: '',
                hostname: '[::1]',
                origin: 'https://[::1]:3000',
                host: '[::1]:3000',
                href: 'https://[::1]:3000/hi/bye',
            },
        },
        {
            it: 'works with IPv6 and password',
            inputs: [
                'https://user:pass@[::1]:3000',
                {
                    paths: [
                        'hi',
                        'bye',
                    ],
                },
            ],
            expect: {
                fullPath: '/hi/bye',
                hash: '',
                // eslint-disable-next-line sonarjs/no-hardcoded-passwords
                password: 'pass',
                pathname: '/hi/bye',
                paths: [
                    'hi',
                    'bye',
                ],
                port: '3000',
                protocol: 'https',
                search: '',
                searchParams: {},
                username: 'user',
                hostname: '[::1]',
                origin: 'https://[::1]:3000',
                host: '[::1]:3000',
                href: 'https://user:pass@[::1]:3000/hi/bye',
            },
        },
    ]);

    it('handles missing base string input', () => {
        assert.deepEquals(
            buildUrl({
                hostname: 'example.com',
                search: {
                    hello: 'there',
                },
            }),
            {
                ...emptyUrlParts,
                hostname: 'example.com',
                href: 'example.com/?hello=there',
                origin: 'example.com',
                host: 'example.com',
                searchParams: {
                    hello: ['there'],
                },
                search: '?hello=there',
            },
        );
    });
});
