const test = require('node:test');
const assert = require('node:assert');

const {
  getLatestGuildRecords,
  countDuplicateGuildRecords
} = require('../utils/guildRecords');

test('keeps the newest row for each guild', () => {
  assert.deepStrictEqual(getLatestGuildRecords([
    { guildId: 'guild-a', channel: 'old' },
    { guildId: 'guild-b', channel: 'only' },
    { guildId: 'guild-a', channel: 'new' }
  ]), [
    { guildId: 'guild-a', channel: 'new' },
    { guildId: 'guild-b', channel: 'only' }
  ]);
});

test('counts duplicate guild rows', () => {
  assert.strictEqual(countDuplicateGuildRecords([
    { guildId: 'guild-a' },
    { guildId: 'guild-a' },
    { guildId: 'guild-b' },
    { guildId: 'guild-a' }
  ]), 2);
});
