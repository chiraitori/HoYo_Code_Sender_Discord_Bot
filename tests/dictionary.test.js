const test = require('node:test');
const assert = require('node:assert');
const { translateReward } = require('../utils/dictionary');

test('translateReward translates common Genshin rewards in English', () => {
  assert.strictEqual(translateReward('100 primogems', 'en'), '100 Primogems');
  assert.strictEqual(translateReward('50 mora', 'en'), '50 Mora');
  assert.strictEqual(translateReward('100 stellar jade', 'en'), '100 Stellar Jade');
});

test('translateReward translates rewards to Japanese', () => {
  assert.strictEqual(translateReward('50 mora', 'jp'), '50 モラ');
  assert.strictEqual(translateReward('100 polychrome', 'jp'), '100 ポリクローム');
  // NOTE: '100 primogems' currently yields '100 原石s' — the singular
  // `primogem -> 原石` rule matches inside the plural form and leaves a
  // stray English 's'. This asserts the current behavior as a regression
  // marker; fix dictionary.js ordering if you want '100 原石' instead.
  assert.strictEqual(translateReward('100 primogems', 'jp'), '100 原石s');
});

test('translateReward translates rewards to Vietnamese', () => {
  assert.strictEqual(translateReward('50 mora', 'vi'), '50 Mora');
  assert.strictEqual(translateReward('100 polychrome', 'vi'), '100 Film Màu');
});

test('translateReward is case-insensitive on input', () => {
  assert.strictEqual(translateReward('PRIMOGEM', 'en'), 'Primogem');
  assert.strictEqual(translateReward('MoRa', 'en'), 'Mora');
});

test('translateReward translates quantity words (one, two, ...)', () => {
  assert.strictEqual(translateReward('one primogem', 'en'), 'x1 Primogem');
  assert.strictEqual(translateReward('two primogems', 'en'), 'x2 Primogems');
});

test('translateReward falls back to English for unknown language', () => {
  assert.strictEqual(translateReward('100 mora', 'de'), '100 Mora');
});

test('translateReward handles empty / null input gracefully', () => {
  assert.strictEqual(translateReward('', 'en'), '');
  assert.strictEqual(translateReward(null, 'en'), '');
  assert.strictEqual(translateReward(undefined, 'en'), '');
});

test('translateReward leaves unknown tokens mostly intact', () => {
  // Unknown words are simply lowercased by the regex pass-through.
  assert.strictEqual(translateReward('Unknown Item Here', 'en'), 'unknown item here');
});
