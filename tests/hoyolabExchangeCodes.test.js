const test = require('node:test');
const assert = require('node:assert');

const {
  extractHoyolabExchangeCodes,
  mergeExchangeCodes,
} = require('../utils/hoyolabExchangeCodes');

const hoyolabResponse = {
  data: {
    modules: [{
      module_type: 7,
      in_feed_position: 3,
      exchange_group: {
        bonuses: [{
          exchange_code: 'ZZZY2ANNIV',
          code_status: 'ON',
          offline_at: 1784476799,
          icon_bonuses: [
            {
              bonus_num: 300,
              icon_url: 'https://hyl-static-res-prod.hoyolab.com/upload/static-resource-v2/2024/06/07/8609070fe148c0e0e367cda25fdae632_208324374592932270.webp'
            },
            {
              bonus_num: 30000,
              icon_url: 'https://hyl-static-res-prod.hoyolab.com/upload/static-resource-v2/2024/06/07/cd6682dd2d871dc93dfa28c3f281d527_6175554878133394960.webp'
            }
          ]
        }]
      }
    }]
  }
};

test('extractHoyolabExchangeCodes extracts active ZZZ exchange codes', () => {
  const [code] = extractHoyolabExchangeCodes('nap', hoyolabResponse);

  assert.strictEqual(code.code, 'ZZZY2ANNIV');
  assert.strictEqual(code.game, 'nap');
  assert.strictEqual(code.status, 'OK');
  assert.strictEqual(code.offlineAt, 1784476799);
  assert.ok(code.rewards.includes('300 Polychrome'));
  assert.ok(code.rewards.includes('30,000 Denny'));
});

test('mergeExchangeCodes adds HoYoLAB-only codes', () => {
  const merged = mergeExchangeCodes(
    'nap',
    [{ code: 'ZENLESSGIFT', game: 'nap', status: 'OK', rewards: '50 Polychrome' }],
    extractHoyolabExchangeCodes('nap', hoyolabResponse)
  );

  assert.ok(merged.some(code => code.code === 'ZENLESSGIFT'));
  assert.ok(merged.some(code => code.code === 'ZZZY2ANNIV'));
});

test('mergeExchangeCodes fills missing rewards from HoYoLAB duplicates', () => {
  const merged = mergeExchangeCodes(
    'nap',
    [{ code: 'ZZZY2ANNIV', game: 'nap', status: 'OK', rewards: '' }],
    extractHoyolabExchangeCodes('nap', hoyolabResponse)
  );

  const code = merged.find(item => item.code === 'ZZZY2ANNIV');
  assert.ok(code.rewards.includes('300 Polychrome'));
});
