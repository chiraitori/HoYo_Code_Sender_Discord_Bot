const test = require('node:test');
const assert = require('node:assert');

const { getCodesToNotify } = require('../utils/autoCodeSend');

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
  const cutoff = Date.now() - 60 * 60 * 1000;

  assert.deepStrictEqual(
    getCodesToNotify([activeCode], existingCodes, 'staging-bot', cutoff),
    []
  );
  assert.deepStrictEqual(
    getCodesToNotify([activeCode], existingCodes, 'production-bot', cutoff),
    [activeCode]
  );
});

test('globally new codes are sent by the current bot', () => {
  assert.deepStrictEqual(
    getCodesToNotify([activeCode], new Map(), 'production-bot', Date.now()),
    [activeCode]
  );
});

test('old legacy codes are not replayed during migration', () => {
  const existingCodes = new Map([
    ['nap:ZZZY2ANNIV', {
      ...activeCode,
      timestamp: new Date('2026-01-01T00:00:00Z')
    }]
  ]);

  assert.deepStrictEqual(
    getCodesToNotify(
      [activeCode],
      existingCodes,
      'production-bot',
      Date.now() - 24 * 60 * 60 * 1000
    ),
    []
  );
});
