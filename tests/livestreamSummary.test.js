const test = require('node:test');
const assert = require('node:assert/strict');
const { getSummarySignature, isReadyForLivestreamSummary } = require('../utils/livestreamSummaryState');

const now = Math.floor(Date.now() / 1000);
const code = value => ({ code: value, expireAt: now + 3600 });
const tracking = (overrides = {}) => ({
  game: 'hkrpg', version: '4.4', streamTime: now - 60,
  youtubeStatus: 'live', codes: [code('LIVE1')], ...overrides
});

test('ZZZ is ready with its single live code, without waiting for three', () => {
  assert.equal(isReadyForLivestreamSummary(tracking({ game: 'nap' }), now), true);
  assert.equal(isReadyForLivestreamSummary(tracking(), now), false);
});

test('complete sets and ended streams can be summarized with any available code count', () => {
  assert.equal(isReadyForLivestreamSummary(tracking({ codes: [code('A'), code('B'), code('C')] }), now), true);
  assert.equal(isReadyForLivestreamSummary(tracking({ youtubeStatus: 'completed' }), now), true);
  assert.equal(isReadyForLivestreamSummary(tracking({
    youtubeStatus: 'unknown', youtubeStreams: [{ status: 'completed' }]
  }), now), true);
});

test('unknown stream end falls back after two hours but a known live stream keeps running', () => {
  const streamTime = now - 2 * 3600;
  assert.equal(isReadyForLivestreamSummary(tracking({ streamTime, youtubeStatus: 'unknown' }), now), true);
  assert.equal(isReadyForLivestreamSummary(tracking({ streamTime }), now), false);
});

test('empty, expired, disabled, future, and stale livestreams are not summarized', () => {
  for (const overrides of [
    { codes: [] }, { codes: [{ code: 'OLD', expireAt: now }] },
    { disabled: true }, { streamTime: now + 60 }, { streamTime: now - 25 * 3600 }
  ]) {
    assert.equal(isReadyForLivestreamSummary(tracking({ game: 'nap', ...overrides }), now), false);
  }
});

test('reordered codes do not change a persisted summary signature', () => {
  assert.equal(getSummarySignature([code('A'), code('B')]), getSummarySignature([code('B'), code('A')]));
});

let configs;
let settings;
let writes;
const stub = (path, exports) => {
  const id = require.resolve(path);
  require.cache[id] = { id, filename: id, loaded: true, exports };
};
stub('../models/Config', { find: () => ({ sort: () => ({ lean: async () => configs }) }) });
stub('../models/Settings', { find: () => ({ sort: () => ({ lean: async () => settings }) }) });
stub('../models/LivestreamTracking', { updateOne: async (query, update) => { writes.push(update); } });
stub('../models/Language', { findOne: async () => ({ language: 'en' }) });
const { summarizeIfReady } = require('../utils/livestreamDistribution');

test.beforeEach(() => {
  configs = [{ guildId: 'guild-a', channel: 'channel-a', forumThreads: { hsr: 'thread-a' } }];
  settings = [];
  writes = [];
});

function deliveredTracking() {
  const codes = [code('LIVE1'), code('LIVE2'), code('LIVE3')];
  const ids = ['bot-a:channel:channel-a', 'bot-a:thread:thread-a'];
  return tracking({
    codes,
    distributedCodeTargets: ids.flatMap(id => codes.map(c => `${id}:code:${c.code}`)),
    codeMessages: new Map(ids.map((id, index) => [id, {
      channelId: index === 0 ? 'channel-a' : 'thread-a', messageId: `message-${index}`,
      summarySignature: getSummarySignature([codes[2]])
    }]))
  });
}

function clientForEdits(edits, patch) {
  return {
    user: { id: 'bot-a' }, guilds: { cache: new Map([['guild-a', {}]]) },
    rest: { patch: patch || (async (route, options) => { edits.push({ route, options }); }),
      post: async () => { throw new Error('Summaries must never send a new message'); } }
  };
}

test('summarizes only live tracking codes in existing channel and thread messages, then skips repeats', async () => {
  const row = deliveredTracking();
  const edits = [];
  const client = clientForEdits(edits);
  await summarizeIfReady(client, row);
  assert.equal(edits.length, 2);
  for (const edit of edits) {
    const fields = edit.options.body.embeds[0].fields;
    assert.deepEqual(fields.slice(0, 3).map(field => field.value.split('\n')[0]),
      ['`LIVE1`', '`LIVE2`', '`LIVE3`']);
    assert.deepEqual(edit.options.body.allowed_mentions.roles, []);
  }
  assert.equal(writes.length, 2);
  for (const message of row.codeMessages.values()) message.summarySignature = getSummarySignature(row.codes);
  await summarizeIfReady(client, row);
  assert.equal(edits.length, 2);
});

test('does not replay to legacy targets without message ids or another bot', async () => {
  const edits = [];
  const row = deliveredTracking();
  row.codeMessages = { 'other-bot:channel:channel-a': { channelId: 'channel-a', messageId: 'old' } };
  await summarizeIfReady(clientForEdits(edits), row);
  assert.equal(edits.length, 0);
});

test('keeps failed summary edits retryable without sending messages', async () => {
  const row = deliveredTracking();
  await summarizeIfReady(clientForEdits([], async () => { throw new Error('Missing Access'); }), row);
  assert.equal(writes.length, 0);
  const edits = [];
  await summarizeIfReady(clientForEdits(edits), row);
  assert.equal(edits.length, 2);
});

test('does not edit disabled destinations or summarize codes not yet delivered there', async () => {
  const edits = [];
  settings = [{ guildId: 'guild-a', autoSendEnabled: false }];
  await summarizeIfReady(clientForEdits(edits), deliveredTracking());
  assert.equal(edits.length, 0);
  settings = [];
  const row = deliveredTracking();
  row.distributedCodeTargets = [];
  await summarizeIfReady(clientForEdits(edits), row);
  assert.equal(edits.length, 0);
});
