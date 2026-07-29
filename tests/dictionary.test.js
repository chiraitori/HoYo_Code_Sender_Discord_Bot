const test = require('node:test');
const assert = require('node:assert');
const { translateReward } = require('../utils/dictionary');

test('translateReward translates common Genshin rewards in English', () => {
  assert.strictEqual(translateReward('100 primogems', 'en'), 'Primogems ×100');
  assert.strictEqual(translateReward('50 mora', 'en'), 'Mora ×50');
  assert.strictEqual(translateReward('100 stellar jade', 'en'), 'Stellar Jade ×100');
});

test('translateReward translates rewards to Japanese', () => {
  assert.strictEqual(translateReward('50 mora', 'jp'), 'モラ ×50');
  assert.strictEqual(translateReward('100 polychrome', 'jp'), 'ポリクローム ×100');
  assert.strictEqual(translateReward('100 primogems', 'jp'), '原石 ×100');
});

test('translateReward translates rewards to Vietnamese', () => {
  assert.strictEqual(translateReward('50 mora', 'vi'), 'Mora ×50');
  assert.strictEqual(translateReward('100 polychrome', 'vi'), 'Film Màu ×100');
});

test('translateReward is case-insensitive on input', () => {
  assert.strictEqual(translateReward('PRIMOGEM', 'en'), 'Primogem');
  assert.strictEqual(translateReward('MoRa', 'en'), 'Mora');
});

test('translateReward translates quantity words (one, two, ...)', () => {
  assert.strictEqual(translateReward('one primogem', 'en'), 'Primogem ×1');
  assert.strictEqual(translateReward('two primogems', 'en'), 'Primogems ×2');
});

test('translateReward falls back to English for unknown language', () => {
  assert.strictEqual(translateReward('100 mora', 'de'), 'Mora ×100');
});

test('translateReward handles empty / null input gracefully', () => {
  assert.strictEqual(translateReward('', 'en'), '');
  assert.strictEqual(translateReward(null, 'en'), '');
  assert.strictEqual(translateReward(undefined, 'en'), '');
});

test('translateReward preserves unknown reward names', () => {
  assert.strictEqual(translateReward('Unknown Item Here', 'en'), 'Unknown Item Here');
});
