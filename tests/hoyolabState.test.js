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
    codes: [{ code: 'ZZZY2ANNIV' }],
  };

  assert.strictEqual(await getState('nap', '3.1'), 3);
});

test('parseAndSaveCodes clears stale distributed flag when codes are found', async () => {
  const found = await parseAndSaveCodes({
    data: {
      modules: [{
        exchange_group: {
          bonuses: [{
            exchange_code: 'ZZZY2ANNIV',
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
  assert.deepStrictEqual(savedUpdate.query, { game: 'nap', version: '3.1' });
});
