const test = require('node:test');
const assert = require('node:assert');

const { getRoleMention } = require('../utils/roleMention');

test('includes a configured role in content and allowed mentions', () => {
  assert.deepStrictEqual(getRoleMention('role-a'), {
    content: '<@&role-a>',
    allowedMentions: { roles: ['role-a'] }
  });
});

test('returns a non-pinging payload when no role is configured', () => {
  assert.deepStrictEqual(getRoleMention(undefined), {
    content: '',
    allowedMentions: { roles: [] }
  });
});
