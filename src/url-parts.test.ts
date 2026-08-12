import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {emptyUrlParts} from './url-parts.js';

describe('emptyUrlParts', () => {
    it('is empty', () => {
        assert.deepEquals(emptyUrlParts, {
            fullPath: '/',
            hash: '',
            host: '',
            hostname: '',
            domains: [],
            href: '/',
            origin: '',
            password: '',
            pathname: '/',
            paths: [],
            port: '',
            protocol: '',
            search: '',
            searchParams: {},
            username: '',
        });
    });
});
