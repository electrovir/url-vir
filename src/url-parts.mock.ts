import {UrlParts} from './url-parts';

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
    port: '8765',
    protocol: 'https',
    search: '?hello=there&why',
    searchParams: {
        hello: ['there'],
        why: [''],
    },
    username: 'user',
};
