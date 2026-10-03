const test = require('node:test');
const assert = require('node:assert/strict');

let row;
let state;
let calls;
let apiResponse;
const stub = (path, exports) => {
  const id = require.resolve(path);
  require.cache[id] = { id, filename: id, loaded: true, exports };
};
stub('../models/LivestreamTracking', {
  findOne: () => {
    const query = Promise.resolve(row);
    query.sort = async () => row;
    return query;
  }
});
stub('../models/Code', { bulkWrite: async () => { calls.push('save'); } });
stub('../utils/hoyolabAPI', {
  getState: async () => state,
  getStateName: () => 'test',
  fetchLivestreamCodes: async () => { calls.push('fetch'); return apiResponse; },
  parseAndSaveCodes: async () => { calls.push('parse'); return true; }
});
stub('../utils/livestreamDistribution', {
  distributeIfReady: async () => { calls.push('distribute'); },
  summarizeIfReady: async (client, tracking) => { calls.push('summary'); assert.equal(tracking, row); }
});
stub('../utils/livestreamAnnouncement', {
  sendAnnouncement: async () => { throw new Error('Should not announce during live'); },
  wasAnnouncementSentForBot: () => true
});
const { checkGame } = require('../utils/livestreamChecker');
const client = { user: { id: 'bot-a' } };

test.beforeEach(() => {
  row = { game: 'nap', version: '3.1', streamTime: Math.floor(Date.now() / 1000) - 60,
    codes: [{ code: 'LIVE1' }], distributedBots: ['bot-a'], youtubeStatus: 'completed' };
  state = 3;
  calls = [];
  apiResponse = null;
});

test('already distributed livestreams still finalize when the API is unavailable', async () => {
  await checkGame(client, 'nap');
  assert.deepEqual(calls, ['fetch', 'summary']);
});

test('pending failed targets do not stop polling for later live codes and retry once per check', async () => {
  state = 5;
  apiResponse = {};
  await checkGame(client, 'nap');
  assert.deepEqual(calls, ['fetch', 'parse', 'save', 'distribute', 'summary']);
});

test('API failures still allow existing pending codes to be delivered', async () => {
  state = 5;
  await checkGame(client, 'nap');
  assert.deepEqual(calls, ['fetch', 'distribute', 'summary']);
});
