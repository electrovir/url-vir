import {itCases} from '@augment-vir/browser-testing';
import {assertTypeOf} from 'run-time-assertions';
import {combineSearchParams, searchParamsToObject, searchParamsToString} from './search-params';
import {SearchParamStrategy, UrlEncoding} from './url-options';

const exampleUrl = 'https://example.com?a=what&b=five&who=you';
const exampleUrlSearchParams = {
    a: ['what'],
    b: ['five'],
    who: ['you'],
};

describe(searchParamsToString.name, () => {
    itCases(searchParamsToString, [
        {
            it: 'returns an empty string for an empty object',
            inputs: [{}],
            expect: '',
        },
        {
            it: 'handles array values',
            inputs: [
                {
                    my: [
                        'value1',
                        'value2',
                    ],
                },
            ],
            expect: '?my=value1&my=value2',
        },
        {
            it: 'converts an object into a search params string',
            inputs: [
                {
                    a: 'five',
                    b: 'four',
                },
            ],
            expect: '?a=five&b=four',
        },
        {
            it: 'does not encode values by default',
            inputs: [{a: 'what,five'}],
            expect: '?a=what,five',
        },
        {
            it: 'encodes values',
            inputs: [
                {a: 'what,-five'},
                {encoding: UrlEncoding.Encode},
            ],
            expect: '?a=what%2C-five',
        },
        {
            it: 'decodes values',
            inputs: [
                {a: 'what%2C-five'},
                {encoding: UrlEncoding.Decode},
            ],
            expect: '?a=what,-five',
        },
        {
            it: 'filters out nullish values',
            inputs: [
                {
                    a: undefined,
                    b: 'four',
                    c: null,
                    d: 'five',
                },
            ],
            expect: '?b=four&d=five',
        },
        {
            it: 'converts values to strings',
            inputs: [
                {
                    a: 'string',
                    b: 42,
                    c: true,
                    d: 52n,
                },
            ],
            expect: '?a=string&b=42&c=true&d=52',
        },
        {
            it: 'handles empty string values',
            inputs: [{a: 'hi', b: '', c: 'bye'}],
            expect: '?a=hi&b&c=bye',
        },
        {
            it: 'works on example code',
            inputs: [
                {
                    hello: ['there'],
                    cheese: [''],
                },
            ],
            expect: '?hello=there&cheese',
        },
    ]);
});

describe(searchParamsToObject.name, () => {
    it('has proper types', () => {
        assertTypeOf(searchParamsToObject(exampleUrl)).toEqualTypeOf<Record<string, string[]>>();
    });

    itCases(searchParamsToObject, [
        {
            it: 'handles missing search params',
            inputs: [
                'https://example.com',
            ],
            expect: {},
        },
        {
            it: 'does not decode by default',
            inputs: [
                'http://example.com/page?filters=Content.Type-0,1,2&sort=Number.%230',
            ],
            expect: {
                filters: ['Content.Type-0,1,2'],
                sort: ['Number.%230'],
            },
        },
        {
            it: 'decodes',
            inputs: [
                'http://example.com/page?filters=Content.Type-0,1,2&sort=Number.%230',
                {
                    encoding: UrlEncoding.Decode,
                },
            ],
            expect: {
                filters: ['Content.Type-0,1,2'],
                sort: ['Number.#0'],
            },
        },
        {
            it: 'encodes',
            inputs: [
                'http://example.com/page?filters=Content.Type-0,1,2&sort=Number.#0',
                {
                    encoding: UrlEncoding.Encode,
                },
            ],
            expect: {
                filters: ['Content.Type-0%2C1%2C2'],
                sort: ['Number.%230'],
            },
        },
        {
            it: 'handles commas in values',
            inputs: [
                'https://example.com?a=what,five',
            ],
            expect: {a: ['what,five']},
        },
        {
            it: 'handles multiple params',
            inputs: [
                exampleUrl,
            ],
            expect: exampleUrlSearchParams,
        },
        {
            it: 'handles URL',
            inputs: [
                new URL(exampleUrl),
            ],
            expect: exampleUrlSearchParams,
        },
        {
            it: 'handles URLSearchParams',
            inputs: [
                new URL(exampleUrl).searchParams,
            ],
            expect: exampleUrlSearchParams,
        },
        {
            it: 'handles an invalid url',
            inputs: [
                '.com?hello=there',
            ],
            expect: {
                hello: ['there'],
            },
        },
        {
            it: 'returns nothing for nothing',
            inputs: [''],
            expect: {},
        },
        {
            it: 'works on example code',
            inputs: ['?hello=there&cheese'],
            expect: {
                hello: ['there'],
                cheese: [''],
            },
        },
    ]);
});

describe(combineSearchParams.name, () => {
    itCases(combineSearchParams, [
        {
            it: 'handles empty objects',
            inputs: [
                {},
                {},
            ],
            expect: {},
        },
        {
            it: 'adds new values',
            inputs: [
                {old: ['value']},
                {new: ['value']},
            ],
            expect: {
                new: ['value'],
                old: ['value'],
            },
        },
        {
            it: 'handles string values',
            inputs: [
                {old: 'value'},
                {new: 'value'},
            ],
            expect: {
                new: ['value'],
                old: ['value'],
            },
        },
        {
            it: 'replaces values by default',
            inputs: [
                {value: 'old'},
                {value: 'new'},
            ],
            expect: {
                value: ['new'],
            },
        },
        {
            it: 'replaces entire string arrays',
            inputs: [
                {value: ['old']},
                {value: ['new']},
            ],
            expect: {
                value: ['new'],
            },
        },
        {
            it: 'removes undefined values',
            inputs: [
                {value: ['old']},
                {value: undefined},
            ],
            expect: {},
        },
        {
            it: 'appends nothing for undefined values',
            inputs: [
                {value: ['old']},
                {value: undefined},
                {searchParamStrategy: SearchParamStrategy.Append},
            ],
            expect: {
                value: ['old'],
            },
        },
        {
            it: 'appends to missing values',
            inputs: [
                {},
                {value: ['new']},
                {searchParamStrategy: SearchParamStrategy.Append},
            ],
            expect: {
                value: ['new'],
            },
        },
        {
            it: 'appends values',
            inputs: [
                {value: 'old'},
                {value: 'new'},
                {searchParamStrategy: SearchParamStrategy.Append},
            ],
            expect: {
                value: [
                    'old',
                    'new',
                ],
            },
        },
        {
            it: 'clears values',
            inputs: [
                {value: 'old', value2: 'another'},
                {value: 'new'},
                {searchParamStrategy: SearchParamStrategy.Clear},
            ],
            expect: {
                value: [
                    'new',
                ],
            },
        },
    ]);
});
