const test = require('node:test');
const assert = require('node:assert');

const { getValidatedLanguage } = require('../utils/dashboardInput');

test('returns internal literals for supported dashboard languages', () => {
  assert.strictEqual(getValidatedLanguage('en'), 'en');
  assert.strictEqual(getValidatedLanguage('jp'), 'jp');
  assert.strictEqual(getValidatedLanguage('vi'), 'vi');
});

test('rejects unsupported and non-string language input', () => {
  assert.strictEqual(getValidatedLanguage('$where'), null);
  assert.strictEqual(getValidatedLanguage({ $ne: null }), null);
  assert.strictEqual(getValidatedLanguage(undefined), null);
});
