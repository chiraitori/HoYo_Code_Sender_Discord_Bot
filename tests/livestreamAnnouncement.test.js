const test = require('node:test');
const assert = require('node:assert');

const {
  getAnnouncementTargets,
  wasAnnouncementSentForBot,
  claimAnnouncementTarget,
  releaseAnnouncementTarget,
  completeAnnouncementTarget
} = require('../utils/livestreamAnnouncement');

test('announcements use default-on settings for legacy guilds', () => {
  const targets = getAnnouncementTargets([
    { guildId: 'guild-a', channel: 'channel-a' }
  ], [], 'nap', new Set(['guild-a']));

  assert.deepStrictEqual(targets.map(target => target.channelId), ['channel-a']);
});

test('announcements respect settings and current bot guilds', () => {
  const configs = [
    { guildId: 'auto-off', channel: 'one' },
    { guildId: 'favorite-off', channel: 'two' },
    { guildId: 'channel-off', channel: 'three' },
    { guildId: 'other-bot', channel: 'four' }
  ];
  const settings = [
    { guildId: 'auto-off', autoSendEnabled: false },
    { guildId: 'favorite-off', favoriteGames: { enabled: true, games: { nap: false } } },
    { guildId: 'channel-off', autoSendOptions: { channel: false } }
  ];

  assert.deepStrictEqual(
    getAnnouncementTargets(
      configs,
      settings,
      'nap',
      new Set(['auto-off', 'favorite-off', 'channel-off'])
    ),
    []
  );
});

test('announcement state is isolated per bot after migration', () => {
  const tracking = {
    announcementSent: true,
    announcementBots: ['staging-bot']
  };

  assert.strictEqual(wasAnnouncementSentForBot(tracking, 'staging-bot'), true);
  assert.strictEqual(wasAnnouncementSentForBot(tracking, 'production-bot'), false);
});

test('legacy global announcement state is preserved until bot state exists', () => {
  assert.strictEqual(wasAnnouncementSentForBot({
    announcementSent: true,
    announcementBots: []
  }, 'production-bot'), true);
});

function createAnnouncementTrackingModel() {
  const state = {
    targets: new Set(),
    claims: new Map()
  };

  return {
    state,
    model: {
      async updateOne(query, update) {
        const pull = update.$pull?.announcementClaims;
        if (pull?.claimedAt?.$lte) {
          const claim = state.claims.get(pull.targetId);
          if (claim && claim <= pull.claimedAt.$lte) {
            state.claims.delete(pull.targetId);
          }
        } else if (pull?.targetId) {
          state.claims.delete(pull.targetId);
        }

        const deliveredTarget = update.$addToSet?.announcementTargets;
        if (deliveredTarget) {
          state.targets.add(deliveredTarget);
        }
      },
      async findOneAndUpdate(query, update) {
        const targetId = query.announcementTargets.$ne;
        if (state.targets.has(targetId) || state.claims.has(targetId)) {
          return null;
        }
        state.claims.set(targetId, update.$push.announcementClaims.claimedAt);
        return {};
      }
    }
  };
}

test('only one concurrent announcement worker can claim a target', async () => {
  const { model } = createAnnouncementTrackingModel();
  const claims = await Promise.all([
    claimAnnouncementTarget('genshin', '7.0', 'bot:channel:123', model),
    claimAnnouncementTarget('genshin', '7.0', 'bot:channel:123', model)
  ]);

  assert.strictEqual(claims.filter(Boolean).length, 1);
});

test('failed announcement releases its claim for retry', async () => {
  const { model } = createAnnouncementTrackingModel();
  assert.strictEqual(
    await claimAnnouncementTarget('genshin', '7.0', 'bot:channel:123', model),
    true
  );

  await releaseAnnouncementTarget(
    'genshin',
    '7.0',
    'bot:channel:123',
    model
  );

  assert.strictEqual(
    await claimAnnouncementTarget('genshin', '7.0', 'bot:channel:123', model),
    true
  );
});

test('successful announcement becomes delivered and cannot be reclaimed', async () => {
  const { model, state } = createAnnouncementTrackingModel();
  await claimAnnouncementTarget('genshin', '7.0', 'bot:channel:123', model);
  await completeAnnouncementTarget(
    'genshin',
    '7.0',
    'bot:channel:123',
    model
  );

  assert.strictEqual(state.targets.has('bot:channel:123'), true);
  assert.strictEqual(state.claims.has('bot:channel:123'), false);
  assert.strictEqual(
    await claimAnnouncementTarget('genshin', '7.0', 'bot:channel:123', model),
    false
  );
});
