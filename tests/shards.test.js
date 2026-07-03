const test = require('node:test');
const assert = require('node:assert');

const {
  normalizeShardIds,
  getShardIdsFromEnv,
  shouldRunPrimaryServices
} = require('../utils/shards');

test('normalizes the single shard id used by Discord.js ShardingManager', () => {
  assert.deepStrictEqual(normalizeShardIds('0'), [0]);
  assert.deepStrictEqual(normalizeShardIds('2'), [2]);
});

test('normalizes array-shaped shard values', () => {
  assert.deepStrictEqual(normalizeShardIds('[0,1]'), [0, 1]);
  assert.deepStrictEqual(normalizeShardIds([3, 4]), [3, 4]);
});

test('defaults to shard 0 when no shard env is present', () => {
  assert.deepStrictEqual(getShardIdsFromEnv({}), [0]);
});

test('detects whether this process should run singleton services', () => {
  assert.strictEqual(shouldRunPrimaryServices({ SHARDS: '0' }), true);
  assert.strictEqual(shouldRunPrimaryServices({ SHARDS: '1' }), false);
  assert.strictEqual(shouldRunPrimaryServices({ SHARDS: '[0,1]' }), true);
});
