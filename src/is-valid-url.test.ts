import {itCases} from '@augment-vir/browser-testing';
import {isValidUrl} from './is-valid-url';

describe(isValidUrl.name, () => {
    itCases(isValidUrl, [
        {
            it: 'accepts all parts',
            input: 'https://user:pass@example.com:8765/path/1/2?hello=there&why#time-to-go',
            expect: true,
        },
        {
            it: 'rejects bad colon placement',
            input: 'https://user:pass@exam:ple.com:8765/path/1/2?hello=there&why#time-to-go',
            expect: false,
        },
        {
            it: 'accepts an existing URL',
            input: new URL('https://github.com'),
            expect: true,
        },
        {
            it: 'accepts valid url parts',
            input: {href: 'https://github.com'},
            expect: true,
        },
        {
            it: 'rejects invalid url parts',
            input: {href: 'github.com'},
            expect: false,
        },
    ]);
});
