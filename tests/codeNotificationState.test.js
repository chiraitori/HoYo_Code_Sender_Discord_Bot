const test = require('node:test');
const assert = require('node:assert');

const {
  getCodesToNotify,
  getCodeNotificationTargetId,
  getPendingCodesForTarget,
  getCodeDeliveryTargets,
  hasCodeReachedAllTargets
} = require('../utils/autoCodeSend');

const activeCode = {
  game: 'nap',
  code: 'ZZZY2ANNIV',
  status: 'OK'
};

test('legacy rows are not replayed for any bot', () => {
  const existingCodes = new Map([
    ['nap:ZZZY2ANNIV', {
      ...activeCode,
      timestamp: new Date('2026-07-17T17:49:26Z'),
      notifiedBots: ['production-bot'],
      notifiedTargets: ['production-bot:channel:channel-a']
    }]
  ]);

  assert.deepStrictEqual(
    getCodesToNotify([activeCode], existingCodes, 'production-bot', {
      now: new Date('2026-07-18T00:00:00Z').getTime()
    }),
    []
  );
  assert.deepStrictEqual(
    getCodesToNotify([activeCode], existingCodes, 'staging-bot', {
      now: new Date('2026-07-18T00:00:00Z').getTime()
    }),
    []
  );
});

test('a bot continues delivery while a modern code remains pending', () => {
  const existingCodes = new Map([
    ['nap:ZZZY2ANNIV', {
      ...activeCode,
      timestamp: new Date('2026-01-01T00:00:00Z'),
      deliveryVersion: 2,
      deliveryBots: ['production-bot'],
      notificationPendingBots: ['production-bot']
    }]
  ]);

  assert.deepStrictEqual(
    getCodesToNotify([activeCode], existingCodes, 'production-bot'),
    [activeCode]
  );
});

test('a completed modern code is not replayed to a newly restored target', () => {
  const existingCodes = new Map([
    ['nap:ZZZY2ANNIV', {
      ...activeCode,
      timestamp: new Date('2026-07-17T17:49:26Z'),
      deliveryVersion: 2,
      deliveryBots: ['production-bot'],
      notificationPendingBots: []
    }]
  ]);

  assert.deepStrictEqual(
    getCodesToNotify([activeCode], existingCodes, 'production-bot', {
      now: new Date('2026-07-18T00:00:00Z').getTime()
    }),
    []
  );
});

test('a second bot can pick up a recently discovered modern code', () => {
  const existingCodes = new Map([
    ['nap:ZZZY2ANNIV', {
      ...activeCode,
      timestamp: new Date('2026-07-17T17:49:26Z'),
      deliveryVersion: 2,
      deliveryBots: ['staging-bot']
    }]
  ]);

  assert.deepStrictEqual(
    getCodesToNotify([activeCode], existingCodes, 'production-bot', {
      now: new Date('2026-07-18T00:00:00Z').getTime(),
      discoveryLookbackHours: 72
    }),
    [activeCode]
  );
});

test('a second bot does not replay an old modern code', () => {
  const existingCodes = new Map([
    ['nap:ZZZY2ANNIV', {
      ...activeCode,
      timestamp: new Date('2026-01-01T00:00:00Z'),
      deliveryVersion: 2,
      deliveryBots: ['staging-bot']
    }]
  ]);

  assert.deepStrictEqual(
    getCodesToNotify([activeCode], existingCodes, 'production-bot', {
      now: new Date('2026-07-18T00:00:00Z').getTime()
    }),
    []
  );
});

test('globally new codes are sent by the current bot', () => {
  assert.deepStrictEqual(
    getCodesToNotify([activeCode], new Map(), 'production-bot'),
    [activeCode]
  );
});

test('only the one newly discovered code is selected from an active code list', () => {
  const completedCode = {
    game: 'nap',
    code: 'ALREADY_SENT',
    status: 'OK'
  };
  const newCode = {
    game: 'nap',
    code: 'ONLY_NEW_CODE',
    status: 'OK'
  };
  const existingCodes = new Map([
    ['nap:ALREADY_SENT', {
      ...completedCode,
      timestamp: new Date('2026-07-29T00:00:00Z'),
      deliveryVersion: 2,
      deliveryBots: ['production-bot'],
      notificationPendingBots: []
    }]
  ]);

  assert.deepStrictEqual(
    getCodesToNotify(
      [completedCode, newCode],
      existingCodes,
      'production-bot'
    ),
    [newCode]
  );
});

test('legacy codes without a delivery version are not replayed', () => {
  const existingCodes = new Map([
    ['nap:ZZZY2ANNIV', {
      ...activeCode,
      timestamp: new Date('2026-01-01T00:00:00Z')
    }]
  ]);

  assert.deepStrictEqual(
    getCodesToNotify([activeCode], existingCodes, 'production-bot'),
    []
  );
});

test('DB reset rows without a delivery version are not treated as new', () => {
  const existingCodes = new Map([
    ['nap:ZZZY2ANNIV', {
      ...activeCode,
      timestamp: new Date('2026-01-01T00:00:00Z'),
      notifiedBots: []
    }]
  ]);

  assert.deepStrictEqual(
    getCodesToNotify([activeCode], existingCodes, 'production-bot'),
    []
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

test('regular code delivery tracks the channel and thread separately', () => {
  const targets = getCodeDeliveryTargets({
    guildId: 'guild-a',
    channel: 'channel-a',
    zzzRole: 'role-a',
    forumThreads: { zzz: 'thread-a' }
  }, {
    autoSendOptions: { channel: true, threads: true }
  }, 'nap', 'bot-a');

  assert.deepStrictEqual(
    targets.map(target => target.id),
    ['bot-a:channel:channel-a', 'bot-a:thread:thread-a']
  );
  assert.deepStrictEqual(targets.map(target => target.roleId), ['role-a', 'role-a']);
});

test('regular code delivery does not duplicate the same channel and thread destination', () => {
  const targets = getCodeDeliveryTargets({
    guildId: 'guild-a',
    channel: 'same-destination',
    forumThreads: { zzz: 'same-destination' }
  }, {
    autoSendOptions: { channel: true, threads: true }
  }, 'nap', 'bot-a');

  assert.deepStrictEqual(targets.map(target => target.id), [
    'bot-a:channel:same-destination'
  ]);
});

test('regular code delivery respects channel and thread options', () => {
  const targets = getCodeDeliveryTargets({
    guildId: 'guild-a',
    channel: 'channel-a',
    forumThreads: { zzz: 'thread-a' }
  }, {
    autoSendOptions: { channel: false, threads: true }
  }, 'nap', 'bot-a');

  assert.deepStrictEqual(targets.map(target => target.id), ['bot-a:thread:thread-a']);
});

test('legacy guild delivery markers suppress a deploy-time replay', () => {
  const legacyTargetId = getCodeNotificationTargetId('bot-a', 'guild-a');
  const existingCodes = new Map([[
    'nap:ZZZY2ANNIV',
    { ...activeCode, notifiedTargets: [legacyTargetId] }
  ]]);

  assert.deepStrictEqual(
    getPendingCodesForTarget(
      [activeCode],
      existingCodes,
      'bot-a:channel:channel-a',
      legacyTargetId
    ),
    []
  );
});

test('a code is complete only after every current target received it', () => {
  const targets = [
    {
      id: 'bot-a:channel:channel-a',
      legacyId: 'bot-a:guild:guild-a'
    },
    {
      id: 'bot-a:thread:thread-a',
      legacyId: 'bot-a:guild:guild-b'
    }
  ];

  assert.strictEqual(hasCodeReachedAllTargets({
    notifiedTargets: ['bot-a:channel:channel-a']
  }, targets), false);

  assert.strictEqual(hasCodeReachedAllTargets({
    notifiedTargets: [
      'bot-a:channel:channel-a',
      'bot-a:guild:guild-b'
    ]
  }, targets), true);
});
