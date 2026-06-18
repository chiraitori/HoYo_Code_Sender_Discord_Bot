const test = require('node:test');
const assert = require('node:assert');

// Mock the HoYoLAB API before loading the module under test.
const hoyolabAPIPath = require.resolve('../utils/hoyolabAPI');
const fetchLivestreamCodes = async (game) => {
  // Return a minimal but realistic HoYoLAB module/bonus structure.
  return {
    data: {
      modules: [
        {
          exchange_group: {
            bonuses: [
              {
                exchange_code: 'GENSHIN123',
                icon_bonuses: [
                  {
                    icon_url: 'https://x/150a941de99e21fc96dce97cde2dae22_.png',
                    bonus_num: 100,
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  };
};

// Inject the mock via the module cache.
require.cache[hoyolabAPIPath] = {
  id: hoyolabAPIPath,
  filename: hoyolabAPIPath,
  loaded: true,
  exports: { fetchLivestreamCodes },
};

const { enrichCodesWithHoyolabRewards, hasRewardText } = require('../utils/codeRewardEnricher');

test('hasRewardText is true for non-empty strings', () => {
  assert.strictEqual(hasRewardText('100 Primogems'), true);
});

test('hasRewardText is false for empty, whitespace, and non-string values', () => {
  assert.strictEqual(hasRewardText(''), false);
  assert.strictEqual(hasRewardText('   '), false);
  assert.strictEqual(hasRewardText(null), false);
  assert.strictEqual(hasRewardText(undefined), false);
  assert.strictEqual(hasRewardText(123), false);
});

test('enrichCodesWithHoyolabRewards returns codes unchanged when none lack rewards', async () => {
  const codes = [{ code: 'ABC', rewards: '100 Primogems' }];
  const result = await enrichCodesWithHoyolabRewards('genshin', codes);
  assert.deepStrictEqual(result, codes);
});

test('enrichCodesWithHoyolabRewards returns input as-is for non-array codes', async () => {
  assert.strictEqual(await enrichCodesWithHoyolabRewards('genshin', null), null);
});

test('enrichCodesWithHoyolabRewards fills in missing reward text from HoYoLAB', async () => {
  const codes = [{ code: 'genshin123', rewards: '' }];
  const [enriched] = await enrichCodesWithHoyolabRewards('genshin', codes);
  assert.ok(enriched.rewards.length > 0, 'expected rewards to be populated');
  assert.ok(/Primogem/i.test(enriched.rewards));
});

test('enrichCodesWithHoyolabRewards leaves codes it cannot match unchanged', async () => {
  const codes = [{ code: 'NOPE', rewards: '' }];
  const [unchanged] = await enrichCodesWithHoyolabRewards('genshin', codes);
  assert.strictEqual(unchanged.rewards, '');
});
