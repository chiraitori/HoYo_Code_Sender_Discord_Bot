const test = require('node:test');
const assert = require('node:assert');

const {
  getDeliveryTargets,
  getPendingDeliveryTargets,
  getDeliveryProgress
} = require('../utils/livestreamDistribution');

test('uses the livestream channel when one is configured', () => {
  const targets = getDeliveryTargets([
    {
      guildId: 'guild-a',
      channel: 'normal-channel',
      livestreamChannel: 'live-channel'
    }
  ], [
    { guildId: 'guild-a', autoSendEnabled: true }
  ], 'nap', 'bot-a');

  assert.deepStrictEqual(targets.map(target => target.id), ['bot-a:channel:live-channel']);
});

test('falls back to the normal channel when no livestream channel is configured', () => {
  const targets = getDeliveryTargets([
    { guildId: 'guild-a', channel: 'normal-channel' }
  ], [
    { guildId: 'guild-a', autoSendEnabled: true }
  ], 'nap', 'bot-a');

  assert.deepStrictEqual(targets.map(target => target.id), ['bot-a:channel:normal-channel']);
});

test('keeps channel and forum thread deliveries as separate retry targets', () => {
  const targets = getDeliveryTargets([
    {
      guildId: 'guild-a',
      channel: 'normal-channel',
      forumThreads: { zzz: 'zzz-thread' }
    }
  ], [
    {
      guildId: 'guild-a',
      autoSendEnabled: true,
      autoSendOptions: { threads: true }
    }
  ], 'nap', 'bot-a');

  assert.deepStrictEqual(
    targets.map(target => target.id).sort(),
    ['bot-a:channel:normal-channel', 'bot-a:thread:zzz-thread']
  );
});

test('does not queue the same destination as both channel and thread', () => {
  const targets = getDeliveryTargets([{
    guildId: 'guild-a',
    channel: 'same-destination',
    forumThreads: { zzz: 'same-destination' }
  }], [{
    guildId: 'guild-a',
    autoSendEnabled: true,
    autoSendOptions: { channel: true, threads: true }
  }], 'nap', 'bot-a');

  assert.deepStrictEqual(targets.map(target => target.id), [
    'bot-a:channel:same-destination'
  ]);
});

test('does not send livestream codes to the main channel when channel delivery is disabled', () => {
  const targets = getDeliveryTargets([{
    guildId: 'guild-a',
    channel: 'normal-channel',
    forumThreads: { zzz: 'zzz-thread' }
  }], [{
    guildId: 'guild-a',
    autoSendEnabled: true,
    autoSendOptions: { channel: false, threads: true }
  }], 'nap', 'bot-a');

  assert.deepStrictEqual(targets.map(target => target.id), ['bot-a:thread:zzz-thread']);
});

test('uses the newest config and settings row when duplicate guild data exists', () => {
  const targets = getDeliveryTargets([
    { guildId: 'guild-a', channel: 'old-channel' },
    { guildId: 'guild-a', channel: 'new-channel' }
  ], [
    { guildId: 'guild-a', autoSendEnabled: false },
    { guildId: 'guild-a', autoSendEnabled: true }
  ], 'nap', 'bot-a');

  assert.deepStrictEqual(targets.map(target => target.id), ['bot-a:channel:new-channel']);
});

test('skips disabled guilds and games excluded by favorites', () => {
  const configs = [
    { guildId: 'disabled', channel: 'channel-a' },
    { guildId: 'excluded', channel: 'channel-b' }
  ];
  const settings = [
    { guildId: 'disabled', autoSendEnabled: false },
    {
      guildId: 'excluded',
      autoSendEnabled: true,
      favoriteGames: { enabled: true, games: { nap: false } }
    }
  ];

  assert.deepStrictEqual(getDeliveryTargets(configs, settings, 'nap', 'bot-a'), []);
});

test('includes configured guilds that do not have a settings document yet', () => {
  const targets = getDeliveryTargets([
    { guildId: 'legacy-guild', channel: 'legacy-channel' }
  ], [], 'nap', 'bot-a');

  assert.deepStrictEqual(
    targets.map(target => target.id),
    ['bot-a:channel:legacy-channel']
  );
});

test('keeps delivery targets separate for different bot tokens', () => {
  const configs = [{ guildId: 'guild-a', channel: 'normal-channel' }];
  const settings = [{ guildId: 'guild-a', autoSendEnabled: true }];

  const stagingTargets = getDeliveryTargets(
    configs,
    settings,
    'nap',
    'staging-bot'
  );
  const productionTargets = getDeliveryTargets(
    configs,
    settings,
    'nap',
    'production-bot'
  );

  assert.notStrictEqual(stagingTargets[0].id, productionTargets[0].id);
});

test('only includes guilds visible to the current bot', () => {
  const configs = [
    { guildId: 'production-guild', channel: 'production-channel' },
    { guildId: 'staging-guild', channel: 'staging-channel' }
  ];
  const settings = [
    { guildId: 'production-guild', autoSendEnabled: true },
    { guildId: 'staging-guild', autoSendEnabled: true }
  ];

  const targets = getDeliveryTargets(
    configs,
    settings,
    'nap',
    'production-bot',
    new Set(['production-guild'])
  );

  assert.deepStrictEqual(
    targets.map(target => target.id),
    ['production-bot:channel:production-channel']
  );
});

test('retries only failed targets and completes after their later success', () => {
  const targets = [
    { id: 'bot-a:channel:one' },
    { id: 'bot-a:channel:two' }
  ];
  const firstPending = getPendingDeliveryTargets(targets, []);
  const firstProgress = getDeliveryProgress(targets, [], firstPending, [
    { status: 'fulfilled', value: true },
    { status: 'rejected', reason: new Error('Missing Access') }
  ]);

  assert.deepStrictEqual(firstProgress.successfulTargetIds, ['bot-a:channel:one']);
  assert.strictEqual(firstProgress.distributed, false);

  const secondPending = getPendingDeliveryTargets(
    targets,
    firstProgress.deliveredTargetIds
  );
  assert.deepStrictEqual(secondPending.map(target => target.id), ['bot-a:channel:two']);

  const secondProgress = getDeliveryProgress(
    targets,
    firstProgress.deliveredTargetIds,
    secondPending,
    [{ status: 'fulfilled', value: true }]
  );
  assert.strictEqual(secondProgress.distributed, true);
});
