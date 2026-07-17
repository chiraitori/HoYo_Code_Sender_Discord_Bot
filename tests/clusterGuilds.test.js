const test = require('node:test');
const assert = require('node:assert');

const { getKnownGuildIds } = require('../utils/clusterGuilds');

test('uses local guild cache when the client is not sharded', async () => {
  const client = {
    guilds: {
      cache: new Map([
        ['guild-a', {}],
        ['guild-b', {}]
      ])
    }
  };

  const guildIds = await getKnownGuildIds(client);
  assert.deepStrictEqual([...guildIds].sort(), ['guild-a', 'guild-b']);
});

test('uses all shard guild caches when the client is sharded', async () => {
  const client = {
    shard: {
      broadcastEval: async callback => [
        callback({ guilds: { cache: new Map([['guild-a', {}]]) } }),
        callback({ guilds: { cache: new Map([['guild-b', {}], ['guild-c', {}]]) } })
      ]
    },
    guilds: {
      cache: new Map([['guild-a', {}]])
    }
  };

  const guildIds = await getKnownGuildIds(client);
  assert.deepStrictEqual([...guildIds].sort(), ['guild-a', 'guild-b', 'guild-c']);
});

test('waits until ShardingManager finishes spawning', async () => {
  let attempts = 0;
  const client = {
    shard: {
      broadcastEval: async callback => {
        attempts += 1;
        if (attempts < 3) {
          const error = new Error('Shards are still being spawned.');
          error.code = 'ShardingInProcess';
          throw error;
        }
        return [callback({ guilds: { cache: new Map([['guild-a', {}]]) } })];
      }
    }
  };

  const guildIds = await getKnownGuildIds(client, {
    maxAttempts: 3,
    retryDelayMs: 0
  });

  assert.strictEqual(attempts, 3);
  assert.deepStrictEqual([...guildIds], ['guild-a']);
});

test('does not retry unrelated broadcast errors', async () => {
  let attempts = 0;
  const client = {
    shard: {
      broadcastEval: async () => {
        attempts += 1;
        throw new Error('IPC disconnected');
      }
    }
  };

  await assert.rejects(
    getKnownGuildIds(client, { maxAttempts: 3, retryDelayMs: 0 }),
    /IPC disconnected/
  );
  assert.strictEqual(attempts, 1);
});
