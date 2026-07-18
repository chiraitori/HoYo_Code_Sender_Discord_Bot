const test = require('node:test');
const assert = require('node:assert');

const {
  normalizeRoleName,
  findMatchingGameRole
} = require('../utils/configuredRoles');

test('normalizes role names for conservative matching', () => {
  assert.strictEqual(normalizeRoleName(' ZZZ Codes '), 'zzzcodes');
  assert.strictEqual(normalizeRoleName('Zenless: Zone Zero'), 'zenlesszonezero');
});

test('finds a uniquely named ZZZ notification role', () => {
  assert.deepStrictEqual(findMatchingGameRole([
    { id: 'one', name: '@everyone', managed: false },
    { id: 'two', name: 'ZZZ Codes', managed: false }
  ], 'nap'), { id: 'two', name: 'ZZZ Codes', managed: false });
});

test('does not guess when multiple ZZZ roles match', () => {
  assert.strictEqual(findMatchingGameRole([
    { id: 'one', name: 'ZZZ', managed: false },
    { id: 'two', name: 'Zenless Zone Zero', managed: false }
  ], 'nap'), null);
});

test('does not match unrelated or managed roles', () => {
  assert.strictEqual(findMatchingGameRole([
    { id: 'one', name: 'ZZZ Players', managed: false },
    { id: 'two', name: 'ZZZ', managed: true }
  ], 'nap'), null);
});
