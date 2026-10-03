const test = require('node:test');
const assert = require('node:assert');

const { sendChannelMessage, editChannelMessage } = require('../utils/discordMessageSender');

function createClient({ localChannel, shardChannel }) {
  const restCalls = [];
  return {
    client: {
      channels: {
        cache: new Map(localChannel ? [['channel-a', localChannel]] : [])
      },
      shard: {
        broadcastEval: async (callback, options) => [
          await callback({
            channels: {
              cache: new Map(shardChannel ? [['channel-a', shardChannel]] : [])
            }
          }, options.context)
        ]
      },
      rest: {
        post: async (route, options) => {
          restCalls.push({ route, options });
        }
      }
    },
    restCalls
  };
}

test('sends on the local shard when the channel is cached locally', async () => {
  const payloads = [];
  const { client, restCalls } = createClient({
    localChannel: { send: async payload => payloads.push(payload) }
  });

  assert.strictEqual(
    await sendChannelMessage(client, 'channel-a', { content: 'hello' }),
    true
  );
  assert.strictEqual(payloads.length, 1);
  assert.strictEqual(restCalls.length, 0);
});

test('sends on the shard that owns the channel', async () => {
  const payloads = [];
  const { client, restCalls } = createClient({
    shardChannel: { send: async payload => payloads.push(payload) }
  });

  assert.strictEqual(
    await sendChannelMessage(client, 'channel-a', {
      content: 'hello',
      embeds: [{ toJSON: () => ({ title: 'Code' }) }],
      allowedMentions: { roles: ['role-a'] }
    }),
    true
  );
  assert.deepStrictEqual(payloads[0].embeds, [{ title: 'Code' }]);
  assert.deepStrictEqual(payloads[0].allowedMentions, { roles: ['role-a'] });
  assert.strictEqual(restCalls.length, 0);
});

test('falls back to REST when no shard has the channel cached', async () => {
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
