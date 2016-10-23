import test from 'ava';
import nock from 'nock';
import { tmpdir } from 'os';
import { join } from 'path';
import mkdirp from 'mkdirp';

import { initialize, isEnabled, destroy } from '../lib/index';

function getRandomBackupPath () {
    const path = join(tmpdir(), `test-tmp-${Math.round(Math.random() * 100000)}`);
    mkdirp.sync(path);
    return path;
}

const defaultToggles = [
    {
        name: 'feature',
        enabled: true,
        strategy: 'default',
    },
];
function mockNetwork (toggles = defaultToggles) {
    nock('http://unleash.app')
        .get('/features')
        .reply(200,  { features: toggles });
}

test('should be able to call api', (t) => {
    mockNetwork();
    initialize({
        url: 'http://unleash.app/features',
        backupPath: getRandomBackupPath(),
        errorHandler (e) {
            throw e;
        },
    });
    t.true(isEnabled('unknown') === false);
    destroy();
});

test.cb('should be able to call isEnabled eventually', (t) => {
    mockNetwork();
    const instance = initialize({
        url: 'http://unleash.app/features',
        backupPath: getRandomBackupPath(),
        errorHandler (e) {
            throw e;
        },
    });

    instance.on('ready', () => {
        t.true(isEnabled('feature') === true);
        t.end();
        destroy();
    });

    t.true(isEnabled('feature') === false);
});
