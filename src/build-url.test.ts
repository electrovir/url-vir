import {itCases} from '@augment-vir/browser-testing';
import {assert} from '@open-wc/testing';
import {buildUrl} from './build-url';
import {emptyUrlParts} from './url-parts';
import {mockUrlParts, mockUrlString} from './url-parts.mock';

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
                    why: [],
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
