/* eslint-disable sonarjs/no-hardcoded-passwords */

import {UrlParts} from './url-parts.js';

export const mockUrlString =
    'https://user:pass@example.com:8765/path/1/2?hello=there&why#time-to-go';
export const mockUrlParts: UrlParts = {
    hash: '#time-to-go',
    host: 'example.com:8765',
    hostname: 'example.com',
    href: mockUrlString,
    origin: 'https://example.com:8765',
    password: 'pass',
    pathname: '/path/1/2',
    paths: [
        'path',
        '1',
        '2',
    ],
    fullPath: '/path/1/2?hello=there&why#time-to-go',
    port: '8765',
    protocol: 'https',
    search: '?hello=there&why',
    searchParams: {
        hello: ['there'],
        why: [],
    },
    username: 'user',
};

const actual = {
    fullPath: '/path/1/2?hello=there&why#time-to-go',
    hash: '#time-to-go',
    host: 'example.com8765',
    hostname: 'example.com8765',
    href: 'https://user:pass@example.com8765/path/1/2?hello=there&why#time-to-go',
    origin: 'https://example.com8765',
    password: 'pass',
    pathname: '/path/1/2',
    paths: [
        'path',
        '1',
        '2',
    ],
    port: '',
    protocol: 'https',
    search: '?hello=there&why',
    searchParams: {hello: ['there'], why: []},
    username: 'user',
};
