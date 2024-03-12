import {defineEndpoints, param} from './endpoint-definition';

export const mockEndpoints = defineEndpoints({
    [param('top-level')]: {},
    topLevel: {
        [param('test')]: {
            bids: {},
        },
    },
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
