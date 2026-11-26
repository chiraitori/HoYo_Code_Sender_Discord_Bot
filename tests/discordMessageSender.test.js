const test = require('node:test');
const assert = require('node:assert');

const {
  createMessageNonce,
  sendChannelMessage,
  editChannelMessage
} = require('../utils/discordMessageSender');

function createClient({ localChannel, shardChannel, shardCount = 1 }) {
  const restCalls = [];
  const evalCalls = [];
  return {
    client: {
      channels: {
        cache: new Map(localChannel ? [['channel-a', localChannel]] : [])
      },
      shard: {
        count: shardCount,
        broadcastEval: async (callback, options) => {
          evalCalls.push({ callback, options });
          if (!options?.context) {
            return Array.from({ length: shardCount }, () => true);
          }
          const result = await callback({
            channels: {
              cache: new Map(shardChannel ? [['channel-a', shardChannel]] : [])
            }
          }, options.context);
          return typeof options.shard === 'number' ? result : [result];
        }
      },
      rest: {
        post: async (route, options) => {
          restCalls.push({ route, options });
          return { id: 'rest-message' };
        }
      }
    },
    restCalls,
    evalCalls
  };
}

test('sends on the local shard with enforceNonce when the channel is cached locally', async () => {
  const payloads = [];
  const { client, restCalls } = createClient({
    localChannel: { send: async payload => payloads.push(payload) }
  });

  assert.strictEqual(
    await sendChannelMessage(client, 'channel-a', { content: 'hello' }, { dedupeKey: 'code:genshin:channel-a:ABC' }),
    true
  );
  assert.strictEqual(payloads.length, 1);
  assert.strictEqual(payloads[0].enforceNonce, true);
  assert.strictEqual(payloads[0].nonce, createMessageNonce('code:genshin:channel-a:ABC'));
  assert.ok(payloads[0].nonce.length <= 25);
  assert.strictEqual(restCalls.length, 0);
});

test('sends on the shard that owns the channel with enforceNonce', async () => {
  const payloads = [];
  const { client, restCalls } = createClient({
    shardChannel: { send: async payload => payloads.push(payload) }
  });

  assert.strictEqual(
    await sendChannelMessage(client, 'channel-a', {
      content: 'hello',
      embeds: [{ toJSON: () => ({ title: 'Code' }) }],
      allowedMentions: { roles: ['role-a'] }
    }, { dedupeKey: 'code:genshin:channel-a:XYZ' }),
    true
  );
  assert.deepStrictEqual(payloads[0].embeds, [{ title: 'Code' }]);
  assert.deepStrictEqual(payloads[0].allowedMentions, { roles: ['role-a'] });
  assert.strictEqual(payloads[0].enforceNonce, true);
  assert.strictEqual(payloads[0].nonce, createMessageNonce('code:genshin:channel-a:XYZ'));
  assert.strictEqual(restCalls.length, 0);
});

test('targets only the owning shard when guildId is provided on a multi-shard cluster', async () => {
  const payloads = [];
  const { client, evalCalls } = createClient({
    shardChannel: { send: async payload => payloads.push(payload) },
    shardCount: 4
  });

  assert.strictEqual(
    await sendChannelMessage(client, 'channel-a', { content: 'hello' }, { guildId: '123456789012345678' }),
    true
  );
  const sendEval = evalCalls.find(call => call.options?.context);
  assert.strictEqual(typeof sendEval.options.shard, 'number');
  assert.strictEqual(payloads.length, 1);
});

test('preferRest bypasses cross-shard broadcastEval and enforces nonce on REST post', async () => {
  const { client, restCalls, evalCalls } = createClient({
    shardChannel: { send: async () => { throw new Error('Should not use broadcastEval'); } },
    shardCount: 2
  });

  assert.strictEqual(
    await sendChannelMessage(client, 'channel-a', {
      content: '<@&role-a>',
      allowedMentions: { roles: ['role-a'] }
    }, { preferRest: true, dedupeKey: 'code:genshin:channel-a:AZHGG7H2ZQZS' }),
    true
  );
  assert.strictEqual(evalCalls.length, 0);
  assert.strictEqual(restCalls.length, 1);
  assert.strictEqual(restCalls[0].options.body.enforce_nonce, true);
  assert.strictEqual(
    restCalls[0].options.body.nonce,
    createMessageNonce('code:genshin:channel-a:AZHGG7H2ZQZS')
  );
});

test('does not retry a non-idempotent send broadcastEval when ShardingInProcess occurs during send', async () => {
  let sendAttempts = 0;
  const client = {
    channels: { cache: new Map() },
    shard: {
      count: 2,
      broadcastEval: async (_callback, options) => {
        if (!options?.context) {
          return [true, true];
        }
        sendAttempts += 1;
        const error = new Error('Shards are still being spawned.');
        error.code = 'ShardingInProcess';
        throw error;
      }
    },
    rest: { post: async () => {} }
  };

  await assert.rejects(
    sendChannelMessage(client, 'channel-a', { content: 'hello' }),
    /Shards are still being spawned/
  );
  assert.strictEqual(sendAttempts, 1);
});

test('falls back to REST with enforce_nonce when no shard has the channel cached', async () => {
  const { client, restCalls } = createClient({});

  assert.strictEqual(
    await sendChannelMessage(client, 'channel-a', {
      content: '<@&role-a>',
      allowedMentions: { roles: ['role-a'] }
    }),
    true
  );
  assert.strictEqual(restCalls.length, 1);
  assert.strictEqual(restCalls[0].options.body.content, '<@&role-a>');
  assert.strictEqual(restCalls[0].options.body.enforce_nonce, true);
  assert.strictEqual(typeof restCalls[0].options.body.nonce, 'string');
  assert.ok(restCalls[0].options.body.nonce.length > 0 && restCalls[0].options.body.nonce.length <= 25);
  assert.deepStrictEqual(restCalls[0].options.body.allowed_mentions, {
    parse: [],
    roles: ['role-a'],
    users: [],
    replied_user: false
  });
});

test('returns the delivered message id from local, remote, and REST sends when requested', async () => {
  for (const location of ['local', 'remote', 'rest']) {
    const channel = { send: async () => ({ id: 'message-a' }) };
    const { client } = createClient({
      localChannel: location === 'local' ? channel : null,
      shardChannel: location === 'remote' ? channel : null
    });
    client.rest.post = async () => ({ id: 'message-a' });
    assert.strictEqual(await sendChannelMessage(client, 'channel-a', {
      content: 'one live code'
    }, { returnMessageId: true }), 'message-a');
  }
});

test('summary edits only embeds with mentions disabled', async () => {
  let call;
  await editChannelMessage({ rest: { patch: async (route, options) => {
    call = { route, options };
  } } }, 'channel-a', 'message-a', { embeds: [{ title: 'All live codes' }] });
  assert.strictEqual(call.route, '/channels/channel-a/messages/message-a');
  assert.deepStrictEqual(call.options.body.embeds, [{ title: 'All live codes' }]);
  assert.strictEqual(call.options.body.content, undefined);
  assert.deepStrictEqual(call.options.body.allowed_mentions.parse, []);
  assert.deepStrictEqual(call.options.body.allowed_mentions.roles, []);
});
