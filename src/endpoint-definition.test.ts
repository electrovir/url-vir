import {randomString} from '@augment-vir/common';
import {assert} from '@open-wc/testing';
import {assertRunTimeType, assertThrows} from 'run-time-assertions';
import {defineEndpoints, param} from './endpoint-definition';
import {mockEndpoints} from './endpoint-definition.mock';

describe(defineEndpoints.name, () => {
    it('defines usable url paths', async () => {
        const myEndpoints = defineEndpoints({
            'https://my-api.example.com': {
                v1: {
                    'get-value': {},
                    'set-value': {
                        // sets a variable path part
                        [param('Value')]: {},
                    },
                },
            },
        });

        assertRunTimeType(
            myEndpoints['https://my-api.example.com'].v1['get-value'].toString(),
            'string',
        );

        assertRunTimeType(
            String(myEndpoints['https://my-api.example.com'].v1['get-value']),
            'string',
        );
    });

    it('blocks other symbol keys', async () => {
        const mySymbol = Symbol('my-symbol');

        assertThrows(() =>
            // @ts-expect-error: only strings and `param()` are allowed as keys
            defineEndpoints({
                'https://my-api.example.com': {
                    [param('Value')]: {},
                    [mySymbol]: {},
                    nested: {},
                },
            }),
        );
    });

    it('correctly encodes url string', () => {
        const endpoints = defineEndpoints({
            topLevel: {
                [param('test')]: {
                    bids: {},
                },
            },
        });
        const pathParam = randomString();

        const expectedPath = `topLevel/${pathParam}/bids`;

        assert.isTrue(endpoints.topLevel(pathParam).bids == expectedPath);
        assert.strictEqual(String(endpoints.topLevel(pathParam).bids), expectedPath);
    });

    it('allows partial access', () => {
        const pathParam = randomString();

        const expectedPath = `topLevel/${pathParam}/bids`;

        assert.isTrue(mockEndpoints.topLevel(pathParam).bids == expectedPath);
        assert.strictEqual(String(mockEndpoints.topLevel(pathParam).bids), expectedPath);
    });

    it('works for top level params', () => {
        assert.strictEqual(mockEndpoints('param').toString(), 'param');
    });

    it('is readonly', () => {
        const toBeMutatedEndpoints = defineEndpoints({
            'https://my-api.example.com': {
                v1: {
                    'get-value': {},
                    'set-value': {
                        // sets a variable path part
                        [param('Value')]: {},
                    },
                },
            },
        });

        assertThrows(() => {
            // @ts-expect-error: this is readonly
            toBeMutatedEndpoints['https://my-api.example.com'] = 'yo' as any;
        });
        assertThrows(() => {
            // @ts-expect-error: this is readonly
            toBeMutatedEndpoints['https://my-api.example.com'].v1['get-value'] = 'yo' as any;
        });
    });
});
