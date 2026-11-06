const test = require('node:test');
const assert = require('node:assert/strict');

let tracking;
let regularRows;
const targetId = 'bot-a:channel:channel-a';
const stub = (path, exports) => {
  const id = require.resolve(path);
  require.cache[id] = { id, filename: id, loaded: true, exports };
};
function applyUpdate(query, update) {
  for (const [key, value] of Object.entries(update.$set || {})) {
    if (key.startsWith('codeMessages.')) {
      const id = key.slice('codeMessages.'.length);
      if (id.endsWith('.summarySignature')) {
        tracking.codeMessages[id.slice(0, -'.summarySignature'.length)].summarySignature = value;
      } else tracking.codeMessages[id] = value;
    } else tracking[key] = value;
  }
  for (const [key, value] of Object.entries(update.$addToSet || {})) {
    tracking[key] = [...new Set([...(tracking[key] || []), ...(value.$each || [value])])];
  }
  return tracking;
}
stub('../models/LivestreamTracking', {
  findOne: async () => tracking,
  updateOne: async (query, update) => applyUpdate(query, update),
  findOneAndUpdate: async (query, update) => applyUpdate(query, update)
});
stub('../models/Config', { find: () => ({ sort: () => ({ lean: async () => [
  { guildId: 'guild-a', channel: 'channel-a' }
] }) }) });
stub('../models/Settings', { find: () => ({ sort: () => ({ lean: async () => [] }) }) });
stub('../models/Code', {
  find: () => ({ lean: async () => regularRows }),
  bulkWrite: async operations => {
    for (const operation of operations) {
      const { filter, update } = operation.updateOne;
      let row = regularRows.find(row => row.code === filter.code);
      if (!row) { row = { ...filter, notifiedTargets: [] }; regularRows.push(row); }
      row.notifiedTargets = [...new Set([...row.notifiedTargets, ...update.$addToSet.notifiedTargets.$each])];
    }
  }
});
stub('../models/Language', { findOne: async () => ({ language: 'en' }) });
stub('../utils/configuredRoles', { reconcileConfiguredRoles: async () => {} });
const axios = require('axios');
axios.get = async () => ({ data: { data: { list: [] } } });
const { distributeIfReady, summarizeIfReady } = require('../utils/livestreamDistribution');

test('Genshin and HSR wait for all 3 livestream codes and still distribute all 3 even when already stored in the Code pool', async () => {
  tracking = {
    game: 'genshin', version: '7.0', streamTime: Math.floor(Date.now() / 1000) - 60,
    found: true, distributed: false, codes: [{ code: 'LIVE1' }], codeMessages: {},
    distributedBots: [], distributedCodeTargets: [], youtubeStatus: 'live'
  };
  // Simulate LIVE1 and LIVE2 already saved and notified in the regular Code pool
  regularRows = [
    { game: 'genshin', code: 'LIVE1', notifiedTargets: [targetId] },
    { game: 'genshin', code: 'LIVE2', notifiedTargets: [targetId] }
  ];
  const sends = [];
  const edits = [];
  const client = {
    user: { id: 'bot-a' }, guilds: { cache: new Map([['guild-a', {}]]) },
    channels: { cache: new Map() }, rest: {
      post: async (route, options) => {
        sends.push(options.body);
        return { id: `message-${sends.length}` };
      },
      patch: async (route, options) => { edits.push({ route, body: options.body }); }
    }
  };

  // 1 code for Genshin: must wait for 3 codes
  await distributeIfReady(client, 'genshin', '7.0');
  assert.equal(sends.length, 0);
  assert.equal(tracking.distributed, false);

  // 2 codes for Genshin: still must wait for 3 codes
  tracking.codes.push({ code: 'LIVE2' });
  await distributeIfReady(client, 'genshin', '7.0');
  assert.equal(sends.length, 0);
  assert.equal(tracking.distributed, false);

  // 3rd code arrives: distributes all 3 codes together even though LIVE1 & LIVE2 are in regularRows pool
  tracking.codes.push({ code: 'LIVE3' });
  await distributeIfReady(client, 'genshin', '7.0');
  assert.equal(sends.length, 1);
  assert.equal(tracking.codeMessages[targetId].messageId, 'message-1');
  assert.equal(tracking.distributed, true);
  assert.deepEqual(
    sends[0].embeds[0].fields.slice(0, 3).map(f => f.value.split('\n')[0]),
    ['`LIVE1`', '`LIVE2`', '`LIVE3`']
  );

  // Reload the same persisted state as a newly started process would: no duplicate sends or edits
  tracking = JSON.parse(JSON.stringify(tracking));
  await distributeIfReady(client, 'genshin', '7.0');
  await summarizeIfReady(client, tracking);
  assert.equal(sends.length, 1);
  assert.equal(edits.length, 0);
});

test('ZZZ distributes immediately with 1 livestream code even when already in the Code pool', async () => {
  tracking = {
    game: 'nap', version: '3.1', streamTime: Math.floor(Date.now() / 1000) - 60,
    found: true, distributed: false, codes: [{ code: 'ZZZLIVE1' }], codeMessages: {},
    distributedBots: [], distributedCodeTargets: [], youtubeStatus: 'live'
  };
  regularRows = [
    { game: 'nap', code: 'ZZZLIVE1', notifiedTargets: [targetId] }
  ];
  const sends = [];
  const client = {
    user: { id: 'bot-a' }, guilds: { cache: new Map([['guild-a', {}]]) },
    channels: { cache: new Map() }, rest: {
      post: async (route, options) => {
        sends.push(options.body);
        return { id: `message-${sends.length}` };
      },
      patch: async () => {}
    }
  };

  await distributeIfReady(client, 'nap', '3.1');
  assert.equal(sends.length, 1);
  assert.equal(tracking.distributed, true);
  assert.equal(sends[0].embeds[0].fields[0].value.split('\n')[0], '`ZZZLIVE1`');
});
