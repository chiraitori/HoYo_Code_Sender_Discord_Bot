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
