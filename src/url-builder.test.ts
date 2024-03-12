import {itCases} from '@augment-vir/browser-testing';
import {assert} from '@open-wc/testing';
import {UrlParts, buildUrl, createHref, emptyUrlParts, parseUrl} from './url-builder';

const mockUrlString = 'https://user:pass@example.com:8765/path/1/2?hello=there&why#time-to-go';
const mockUrlParts: UrlParts = {
    hash: '#time-to-go',
    host: 'example.com:8765',
    hostname: 'example.com',
    href: mockUrlString,
    origin: 'https://example.com:8765',
    password: 'pass',
    pathname: '/path/1/2',
    port: '8765',
    protocol: 'https',
    search: '?hello=there&why',
    searchParams: {
        hello: ['there'],
        why: [''],
    },
    username: 'user',
};

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
            it: 'works without hash',
            inputs: [
                'https://user:pass@example.com:8765/path/1/2?hello=there&why',
            ],
            expect: {
                ...mockUrlParts,
                hash: '',
                href: 'https://user:pass@example.com:8765/path/1/2?hello=there&why',
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
                pathname: '/',
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
                href: 'https://example.com/path/1/2',
                origin: 'https://example.com',
                password: '',
                pathname: '/path/1/2',
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
                href: '/example.com:8765/path/1/2?hello=there&why#time-to-go',
                origin: '',
                password: '',
                pathname: '/example.com:8765/path/1/2',
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
                href: '/example.com:8765/path/1/2?hello=there&why#time-to-go',
                origin: '',
                password: '',
                pathname: '/example.com:8765/path/1/2',
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
                hostname: '',
                href: ':example.com:8765/path/1/2?hello=there&why#time-to-go',
                origin: ':example.com:8765',
                password: '',
                port: 'example.com:8765',
                protocol: '',
                username: '',
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
                href: 'https://example.com/',
                origin: 'https://example.com',
                protocol: 'https',
            },
        },
    ]);
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
    ]);
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
                    why: [''],
                },
                href: 'https://user:pass@example.com:8765/path/1/2?hello=there&why&derp=hi#time-to-go',
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
    ]);

    it('handles missing base string input', () => {
        assert.deepStrictEqual(
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
    it('handles missing base string input', () => {
        assert.deepStrictEqual(
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
