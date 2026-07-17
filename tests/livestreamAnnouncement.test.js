const test = require('node:test');
const assert = require('node:assert');

const {
  getAnnouncementTargets,
  wasAnnouncementSentForBot
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
