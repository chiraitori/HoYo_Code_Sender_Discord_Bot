const test = require('node:test');
const assert = require('node:assert');

// --- Mock the Mongoose models BEFORE requiring the module under test ---
const configStore = new Map(); // guildId -> config doc
const settingsStore = new Map(); // guildId -> settings doc

require.cache[require.resolve('../models/Config')] = {
  id: require.resolve('../models/Config'),
  filename: require.resolve('../models/Config'),
  loaded: true,
  exports: {
    findOne: ({ guildId }) => ({
      sort: async () => configStore.get(guildId) || null,
    }),
  },
};

require.cache[require.resolve('../models/Settings')] = {
  id: require.resolve('../models/Settings'),
  filename: require.resolve('../models/Settings'),
  loaded: true,
  exports: {
    findOneAndUpdate: async (query, update) => {
      const guildId = query.guildId;
      const existing = settingsStore.get(guildId) || { guildId };
      const merged = { ...existing, ...flattenDot(update) };
      settingsStore.set(guildId, merged);
      return merged;
    },
  },
};

// helper to turn { 'a.b': v } into { a: { b: v } } (shallow, one level)
function flattenDot(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.includes('.')) {
      const [head, ...rest] = k.split('.');
      out[head] = out[head] || {};
      out[head][rest.join('.')] = v;
    } else {
      out[k] = v;
    }
  }
  return out;
}

const { validateChannel } = require('../utils/channelValidator');

// --- Mock Discord client / guild / channel builders ---
function makeClient({ guild, guildFetchThrows = false } = {}) {
  return {
    guilds: {
      fetch: async () => {
        if (guildFetchThrows) throw new Error('fetch failed');
        return guild ?? null;
      },
    },
  };
}

function makeGuild({ channel, meCanPermissions = true, sendWorks = true } = {}) {
  return {
    members: { me: {} },
    channels: {
      fetch: async () => channel ?? null,
    },
    _channel: channel,
    _meCanPermissions: meCanPermissions,
  };
}

function makeChannel({ hasPerms = true, sendWorks = true } = {}) {
  return {
    permissionsFor: () => ({
      has: () => hasPerms,
    }),
    send: sendWorks ? () => {} : undefined,
  };
}

test.beforeEach(() => {
  configStore.clear();
  settingsStore.clear();
});

test('validateChannel returns invalid when the guild is not accessible', async () => {
  const client = makeClient({ guild: null });
  const result = await validateChannel(client, 'g1');
  assert.strictEqual(result.isValid, false);
  assert.strictEqual(result.channel, null);
  assert.strictEqual(result.error, 'Guild not accessible');
});

test('validateChannel returns invalid when no config/channel exists', async () => {
  const client = makeClient({ guild: makeGuild() });
  const result = await validateChannel(client, 'g2');
  assert.strictEqual(result.isValid, false);
  assert.strictEqual(result.error, 'No channel configured');
});

test('validateChannel returns invalid when the channel is missing', async () => {
  configStore.set('g3', { guildId: 'g3', channel: 'ch3' });
  const client = makeClient({ guild: makeGuild({ channel: null }) });
  const result = await validateChannel(client, 'g3');
  assert.strictEqual(result.isValid, false);
  assert.strictEqual(result.error, 'Channel not found');
});

test('validateChannel returns invalid when bot lacks permissions', async () => {
  configStore.set('g4', { guildId: 'g4', channel: 'ch4' });
  const guild = makeGuild({ channel: makeChannel({ hasPerms: false }) });
  const client = makeClient({ guild });
  const result = await validateChannel(client, 'g4');
  assert.strictEqual(result.isValid, false);
  assert.strictEqual(result.error, 'Missing permissions in channel');
});

test('validateChannel returns invalid when channel has no send()', async () => {
  configStore.set('g5', { guildId: 'g5', channel: 'ch5' });
  const guild = makeGuild({ channel: makeChannel({ sendWorks: false }) });
  const client = makeClient({ guild });
  const result = await validateChannel(client, 'g5');
  assert.strictEqual(result.isValid, false);
  assert.strictEqual(result.error, 'Channel is not a text channel');
});

test('validateChannel returns the channel when everything is valid', async () => {
  configStore.set('g6', { guildId: 'g6', channel: 'ch6' });
  const channel = makeChannel({ hasPerms: true, sendWorks: true });
  const guild = makeGuild({ channel });
  const client = makeClient({ guild });
  const result = await validateChannel(client, 'g6');
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.error, null);
  assert.strictEqual(result.channel, channel);
  // it should also have persisted a "valid" status to Settings
  const stored = settingsStore.get('g6');
  assert.ok(stored && stored.channelStatus, 'expected channelStatus to be written');
  assert.strictEqual(stored.channelStatus.isInvalid, false);
});
