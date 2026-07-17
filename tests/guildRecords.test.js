const test = require('node:test');
const assert = require('node:assert');

const {
  getLatestGuildRecords,
  countDuplicateGuildRecords,
  removeOtherGuildRecords
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

test('removes duplicate rows while preserving the selected document', async () => {
  let receivedFilter = null;
  const Model = {
    deleteMany: async filter => {
      receivedFilter = filter;
      return { deletedCount: 2 };
    }
  };

  assert.strictEqual(
    await removeOtherGuildRecords(Model, 'guild-a', 'keep-id'),
    2
  );
  assert.deepStrictEqual(receivedFilter, {
    guildId: 'guild-a',
    _id: { $ne: 'keep-id' }
  });
});

test('does not delete anything without a confirmed document to preserve', async () => {
  let called = false;
  const Model = {
    deleteMany: async () => {
      called = true;
      return { deletedCount: 1 };
    }
  };

  assert.strictEqual(await removeOtherGuildRecords(Model, 'guild-a', null), 0);
  assert.strictEqual(called, false);
});
