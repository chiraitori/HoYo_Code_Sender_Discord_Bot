const test = require('node:test');
const assert = require('node:assert');

let trackingDocument = null;
let savedUpdate = null;

const trackingPath = require.resolve('../models/LivestreamTracking');
require.cache[trackingPath] = {
  id: trackingPath,
  filename: trackingPath,
  loaded: true,
  exports: {
    findOne: async () => trackingDocument,
    findOneAndUpdate: async (query, update) => {
      savedUpdate = { query, update };
      return { ...query, ...update };
    },
  },
};

delete require.cache[require.resolve('../utils/hoyolabAPI')];
const { getState, parseAndSaveCodes } = require('../utils/hoyolabAPI');

test.beforeEach(() => {
  trackingDocument = null;
  savedUpdate = null;
});

test('getState keeps searching when a row is marked distributed without found codes', async () => {
  trackingDocument = {
    game: 'nap',
    version: '3.1',
    streamTime: Math.floor(Date.now() / 1000) - 60,
    disabled: false,
    found: false,
    distributed: true,
    codes: [],
  };

  assert.strictEqual(await getState('nap', '3.1'), 4);
});

test('getState returns distributed after codes were found and distributed', async () => {
  trackingDocument = {
    game: 'nap',
    version: '3.1',
    streamTime: Math.floor(Date.now() / 1000) - 60,
    disabled: false,
    found: true,
    distributed: true,
    codes: [
      { code: 'ZZZLIVE1' },
      { code: 'ZZZLIVE2' },
      { code: 'ZZZLIVE3' }
    ],
  };

  assert.strictEqual(await getState('nap', '3.1'), 3);
});

test('getState tracks distribution independently for each bot', async () => {
  trackingDocument = {
    game: 'nap',
    version: '3.1',
    streamTime: Math.floor(Date.now() / 1000) - 60,
    disabled: false,
    found: true,
    distributed: true,
    distributedBots: ['staging-bot'],
    codes: [
      { code: 'ZZZLIVE1' },
      { code: 'ZZZLIVE2' },
      { code: 'ZZZLIVE3' }
    ],
  };

  assert.strictEqual(await getState('nap', '3.1', 'staging-bot'), 3);
  assert.strictEqual(await getState('nap', '3.1', 'production-bot'), 5);
});

test('getState does not distribute an incomplete promotional-code set', async () => {
  trackingDocument = {
    game: 'nap',
    version: '3.1',
    streamTime: Math.floor(Date.now() / 1000) - 60,
    disabled: false,
    found: true,
    distributed: false,
    codes: [{ code: 'ZZZY2ANNIV' }]
  };

  assert.strictEqual(await getState('nap', '3.1', 'production-bot'), 4);
});

test('parseAndSaveCodes clears stale distributed flag when codes are found', async () => {
  const found = await parseAndSaveCodes({
    data: {
      modules: [{
        exchange_group: {
          bonuses_summary: { code_count: 3 },
          bonuses: [{
            exchange_code: 'ZZZY2ANNIV',
            offline_at: 1784476799,
            icon_bonuses: [],
          }, {
            exchange_code: 'ZZZLIVE2',
            offline_at: 1784476799,
            icon_bonuses: [],
          }, {
            exchange_code: 'ZZZLIVE3',
            offline_at: 1784476799,
            icon_bonuses: [],
          }],
        },
      }],
    },
  }, 'nap', '3.1');

  assert.strictEqual(found, true);
  assert.strictEqual(savedUpdate.update.found, true);
  assert.strictEqual(savedUpdate.update.distributed, false);
  assert.deepStrictEqual(savedUpdate.update.distributedBots, []);
  assert.deepStrictEqual(savedUpdate.update.distributedTargets, []);
  assert.deepStrictEqual(savedUpdate.query, { game: 'nap', version: '3.1' });
});

test('parseAndSaveCodes does not treat one promotional code as a livestream set', async () => {
  const found = await parseAndSaveCodes({
    data: {
      modules: [{
        exchange_group: {
          bonuses_summary: { code_count: 1 },
          bonuses: [{
            exchange_code: 'ZZZY2ANNIV',
            offline_at: 1784476799,
            icon_bonuses: [],
          }],
        },
      }],
    },
  }, 'nap', '3.1');

  assert.strictEqual(found, false);
  assert.strictEqual(savedUpdate.update.found, false);
  assert.strictEqual(savedUpdate.update.distributed, undefined);
  assert.strictEqual(savedUpdate.update.distributedTargets, undefined);
});

test('repeated complete livestream responses preserve delivery progress', async () => {
  trackingDocument = {
    game: 'nap',
    version: '3.1',
    found: true,
    distributed: true,
    distributedBots: ['bot-a'],
    distributedTargets: ['bot-a:channel:one'],
    codes: [
      { code: 'ZZZLIVE1' },
      { code: 'ZZZLIVE2' },
      { code: 'ZZZLIVE3' }
    ]
  };

  const found = await parseAndSaveCodes({
    data: {
      modules: [{
        exchange_group: {
          bonuses_summary: { code_count: 3 },
          bonuses: ['ZZZLIVE1', 'ZZZLIVE2', 'ZZZLIVE3'].map(exchange_code => ({
            exchange_code,
            icon_bonuses: []
          }))
        }
      }]
    }
  }, 'nap', '3.1');

  assert.strictEqual(found, true);
  assert.strictEqual(savedUpdate.update.distributed, undefined);
  assert.strictEqual(savedUpdate.update.distributedBots, undefined);
  assert.strictEqual(savedUpdate.update.distributedTargets, undefined);
});
