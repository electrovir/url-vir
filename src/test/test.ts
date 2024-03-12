import {defineEndpoints, param} from '../endpoint-definition';

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
