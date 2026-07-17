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
  ], 'nap');

  assert.deepStrictEqual(targets.map(target => target.id), ['channel:live-channel']);
});

test('falls back to the normal channel when no livestream channel is configured', () => {
  const targets = getDeliveryTargets([
    { guildId: 'guild-a', channel: 'normal-channel' }
  ], [
    { guildId: 'guild-a', autoSendEnabled: true }
  ], 'nap');

  assert.deepStrictEqual(targets.map(target => target.id), ['channel:normal-channel']);
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
  ], 'nap');

  assert.deepStrictEqual(
    targets.map(target => target.id).sort(),
    ['channel:normal-channel', 'thread:zzz-thread']
  );
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

  assert.deepStrictEqual(getDeliveryTargets(configs, settings, 'nap'), []);
});

test('retries only failed targets and completes after their later success', () => {
  const targets = [
    { id: 'channel:one' },
    { id: 'channel:two' }
  ];
  const firstPending = getPendingDeliveryTargets(targets, []);
  const firstProgress = getDeliveryProgress(targets, [], firstPending, [
    { status: 'fulfilled', value: true },
    { status: 'rejected', reason: new Error('Missing Access') }
  ]);

  assert.deepStrictEqual(firstProgress.successfulTargetIds, ['channel:one']);
  assert.strictEqual(firstProgress.distributed, false);

  const secondPending = getPendingDeliveryTargets(
    targets,
    firstProgress.deliveredTargetIds
  );
  assert.deepStrictEqual(secondPending.map(target => target.id), ['channel:two']);

  const secondProgress = getDeliveryProgress(
    targets,
    firstProgress.deliveredTargetIds,
    secondPending,
    [{ status: 'fulfilled', value: true }]
  );
  assert.strictEqual(secondProgress.distributed, true);
});
