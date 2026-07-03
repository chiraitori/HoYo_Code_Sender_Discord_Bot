const test = require('node:test');
const assert = require('node:assert');

const { calculateReshardTarget } = require('../utils/resharding');

test('keeps the current shard count when usage is below threshold', () => {
  assert.strictEqual(calculateReshardTarget({
    totalGuilds: 1500,
    currentShards: 1,
    guildsPerShard: 2500,
    threshold: 0.8
  }), 1);
});

test('adds shards when guild count exceeds threshold capacity', () => {
  assert.strictEqual(calculateReshardTarget({
    totalGuilds: 2100,
    currentShards: 1,
    guildsPerShard: 2500,
    threshold: 0.8
  }), 2);
});

test('uses Discord recommended shard count when it is higher', () => {
  assert.strictEqual(calculateReshardTarget({
    totalGuilds: 2100,
    currentShards: 1,
    guildsPerShard: 2500,
    threshold: 0.8,
    discordRecommended: 3
  }), 3);
});

test('never scales down during an automatic reshard check', () => {
  assert.strictEqual(calculateReshardTarget({
    totalGuilds: 10,
    currentShards: 4,
    guildsPerShard: 2500,
    threshold: 0.8,
    discordRecommended: 1
  }), 4);
});
