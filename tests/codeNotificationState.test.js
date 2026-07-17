const test = require('node:test');
const assert = require('node:assert');

const {
  getCodesToNotify,
  getCodeNotificationTargetId,
  getPendingCodesForTarget
} = require('../utils/autoCodeSend');

const activeCode = {
  game: 'nap',
  code: 'ZZZY2ANNIV',
  status: 'OK'
};

test('a staging notification does not suppress production', () => {
  const existingCodes = new Map([
    ['nap:ZZZY2ANNIV', {
      ...activeCode,
      timestamp: new Date(),
      notifiedBots: ['staging-bot']
    }]
  ]);

  assert.deepStrictEqual(
    getCodesToNotify([activeCode], existingCodes, 'staging-bot'),
    []
  );
  assert.deepStrictEqual(
    getCodesToNotify([activeCode], existingCodes, 'production-bot'),
    [activeCode]
  );
});

test('globally new codes are sent by the current bot', () => {
  assert.deepStrictEqual(
    getCodesToNotify([activeCode], new Map(), 'production-bot'),
    [activeCode]
  );
});

test('legacy codes without notifiedBots array are not replayed', () => {
  // Simulates records from before the notifiedBots field was added
  const existingCodes = new Map([
    ['nap:ZZZY2ANNIV', {
      ...activeCode,
      timestamp: new Date('2026-01-01T00:00:00Z')
      // note: no notifiedBots field at all
    }]
  ]);

  assert.deepStrictEqual(
    getCodesToNotify([activeCode], existingCodes, 'production-bot'),
    []
  );
});

test('codes with empty notifiedBots array are always retried', () => {
  // After DB clear, codes are re-inserted with notifiedBots: []
  const existingCodes = new Map([
    ['nap:ZZZY2ANNIV', {
      ...activeCode,
      timestamp: new Date('2026-01-01T00:00:00Z'),
      notifiedBots: []  // modern schema, no bot has notified yet
    }]
  ]);

  assert.deepStrictEqual(
    getCodesToNotify([activeCode], existingCodes, 'production-bot'),
    [activeCode]
  );
});

test('expired codes from API are filtered out', () => {
  const expiredCode = { ...activeCode, status: 'EXPIRED' };
  assert.deepStrictEqual(
    getCodesToNotify([expiredCode], new Map(), 'production-bot'),
    []
  );
});

test('notification targets are isolated by bot and guild', () => {
  assert.notStrictEqual(
    getCodeNotificationTargetId('bot-a', 'guild-a'),
    getCodeNotificationTargetId('bot-a', 'guild-b')
  );
  assert.notStrictEqual(
    getCodeNotificationTargetId('bot-a', 'guild-a'),
    getCodeNotificationTargetId('bot-b', 'guild-a')
  );
});

test('already delivered guild targets are not queued again', () => {
  const targetId = getCodeNotificationTargetId('bot-a', 'guild-a');
  const existingCodes = new Map([
    ['nap:ZZZY2ANNIV', {
      ...activeCode,
      notifiedBots: [],
      notifiedTargets: [targetId]
    }]
  ]);

  assert.deepStrictEqual(
    getPendingCodesForTarget([activeCode], existingCodes, targetId),
    []
  );
  assert.deepStrictEqual(
    getPendingCodesForTarget(
      [activeCode],
      existingCodes,
      getCodeNotificationTargetId('bot-a', 'guild-b')
    ),
    [activeCode]
  );
});
