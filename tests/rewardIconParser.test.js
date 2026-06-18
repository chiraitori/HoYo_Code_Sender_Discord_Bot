const test = require('node:test');
const assert = require('node:assert');
const {
  getIconHash,
  getItemName,
  parseIconBonuses,
} = require('../utils/rewardIconParser');

test('getIconHash extracts a 32-char hex hash from a URL', () => {
  const url = 'https://example.com/150a941de99e21fc96dce97cde2dae22_.png';
  assert.strictEqual(getIconHash(url), '150a941de99e21fc96dce97cde2dae22');
});

test('getIconHash returns null when no hash is present', () => {
  assert.strictEqual(getIconHash('https://example.com/icon.png'), null);
  assert.strictEqual(getIconHash(''), null);
  assert.strictEqual(getIconHash(null), null);
});

test('getItemName returns the string for legacy string entries', () => {
  assert.strictEqual(getItemName('Primogem'), 'Primogem');
});

test('getItemName resolves localized objects by language, falling back to en', () => {
  const item = { en: 'Stellar Jade', ja: '星玉', vi: 'Tinh Thạch' };
  assert.strictEqual(getItemName(item, 'en'), 'Stellar Jade');
  assert.strictEqual(getItemName(item, 'ja'), '星玉');
  assert.strictEqual(getItemName(item, 'vi'), 'Tinh Thạch');
  // Missing language falls back to English.
  assert.strictEqual(getItemName(item, 'fr'), 'Stellar Jade');
});

test('getItemName returns null for empty input', () => {
  assert.strictEqual(getItemName(null), null);
  assert.strictEqual(getItemName(undefined), null);
});

test('parseIconBonuses returns "Unknown Rewards" for empty input', () => {
  assert.strictEqual(parseIconBonuses([], 'genshin', 'en'), 'Unknown Rewards');
  assert.strictEqual(parseIconBonuses(null, 'genshin', 'en'), 'Unknown Rewards');
});

test('parseIconBonuses maps known Genshin icons to item names', () => {
  const bonuses = [
    { icon_url: 'https://x/150a941de99e21fc96dce97cde2dae22_.png', bonus_num: 100 },
    { icon_url: 'https://x/503abf5f2f2c8b2013dde0f2197fc9ac_.png', bonus_num: 50000 },
  ];
  const result = parseIconBonuses(bonuses, 'genshin', 'en');
  assert.ok(result.includes('100 Primogem'));
  assert.ok(result.includes('50,000 Mora'));
});

test('parseIconBonuses localizes Genshin items', () => {
  const bonuses = [
    { icon_url: 'https://x/150a941de99e21fc96dce97cde2dae22_.png', bonus_num: 300 },
  ];
  assert.ok(parseIconBonuses(bonuses, 'genshin', 'ja').includes('原石'));
  assert.ok(parseIconBonuses(bonuses, 'genshin', 'vi').includes('Nguyên Thạch'));
});

test('parseIconBonuses reports Unknown Item for unrecognized icons', () => {
  const bonuses = [{ icon_url: 'https://x/ffffffffffffffffffffffffffffffff_.png', bonus_num: 5 }];
  assert.ok(parseIconBonuses(bonuses, 'genshin', 'en').includes('Unknown Item'));
});
