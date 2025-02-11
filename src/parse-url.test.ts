/* eslint-disable sonarjs/no-hardcoded-passwords */
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
                href: ':example.com:8765/path/1/2?hello=there&why#time-to-go',
                origin: ':example.com:8765',
                password: '',
                port: '8765',
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
