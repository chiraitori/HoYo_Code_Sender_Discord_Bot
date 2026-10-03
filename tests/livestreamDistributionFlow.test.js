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

test('progressive live delivery survives restart, sends only new codes, and edits the last message into a full summary', async () => {
  tracking = {
    game: 'genshin', version: '7.0', streamTime: Math.floor(Date.now() / 1000) - 60,
    found: true, distributed: false, codes: [{ code: 'LIVE1' }], codeMessages: {},
    distributedBots: [], distributedCodeTargets: [], youtubeStatus: 'live'
  };
  regularRows = [];
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
  await distributeIfReady(client, 'genshin', '7.0');
  assert.equal(tracking.codeMessages[targetId].messageId, 'message-1');
  assert.equal(tracking.distributed, true);
  await distributeIfReady(client, 'genshin', '7.0');
  assert.equal(sends.length, 1);

  for (const value of ['LIVE2', 'LIVE3']) {
    tracking.codes.push({ code: value });
    tracking.distributed = false;
    tracking.distributedBots = [];
    await distributeIfReady(client, 'genshin', '7.0');
  }
  assert.equal(sends.length, 3);
  assert.deepEqual(sends.map(body => body.embeds[0].fields[0].value.split('\n')[0]),
    ['`LIVE1`', '`LIVE2`', '`LIVE3`']);
  assert.equal(tracking.codeMessages[targetId].messageId, 'message-3');
  await summarizeIfReady(client, tracking);
  assert.equal(edits.length, 1);
  assert.equal(edits[0].route, '/channels/channel-a/messages/message-3');
  assert.deepEqual(edits[0].body.embeds[0].fields.slice(0, 3).map(f => f.value.split('\n')[0]),
    ['`LIVE1`', '`LIVE2`', '`LIVE3`']);

  // Reload the same persisted state as a newly started process would.
  tracking = JSON.parse(JSON.stringify(tracking));
  await distributeIfReady(client, 'genshin', '7.0');
  await summarizeIfReady(client, tracking);
  assert.equal(sends.length, 3);
  assert.equal(edits.length, 1);
});
