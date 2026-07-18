'use strict';

const test = require('node:test');
const assert = require('node:assert');

const {
  getCodeNotificationEvidence,
  buildRecoveredConfig
} = require('../utils/configRecovery');

function message(overrides = {}) {
  return {
    author: { id: 'bot' },
    content: '',
    embeds: [],
    createdTimestamp: 100,
    mentions: { roles: new Map() },
    ...overrides
  };
}

test('recognizes a regular code notification and its role mention', () => {
  const evidence = getCodeNotificationEvidence(message({
    content: '<@&333> New Zenless Zone Zero Codes!',
    embeds: [{
      title: 'New Zenless Zone Zero Codes!',
      description: '**ZZZY2ANNIV**\n[Click to Redeem](https://zenless.hoyoverse.com/redemption)'
    }],
    mentions: { roles: new Map([['333', { id: '333' }]]) }
  }), 'bot');

  assert.deepStrictEqual(evidence, {
    game: 'nap',
    type: 'regular',
    roleId: '333',
    createdTimestamp: 100
  });
});

test('recognizes livestream code embeds but rejects announcements without codes', () => {
  const livestream = getCodeNotificationEvidence(message({
    content: 'New Honkai: Star Rail Livestream Codes!',
    embeds: [{
      title: 'Honkai: Star Rail Livestream Codes',
      fields: [
        { name: 'Code 1', value: 'ABC123' },
        { name: 'Redeem Here', value: '[Click to Redeem](https://hsr.hoyoverse.com/gift)' }
      ]
    }]
  }), 'bot');
  const announcement = getCodeNotificationEvidence(message({
    embeds: [{
      title: 'Honkai: Star Rail Special Program',
      description: 'The livestream starts soon'
    }]
  }), 'bot');

  assert.strictEqual(livestream.type, 'livestream');
  assert.strictEqual(livestream.game, 'hkrpg');
  assert.strictEqual(announcement, null);
});

test('ignores messages sent by another bot application', () => {
  const evidence = getCodeNotificationEvidence(message({
    author: { id: 'other-bot' },
    content: 'New Genshin Impact Codes!',
    embeds: [{ description: '[Redeem](https://genshin.hoyoverse.com/en/gift?code=TEST)' }]
  }), 'bot');

  assert.strictEqual(evidence, null);
});

test('restores regular and separate livestream channels without guessing roles', () => {
  const config = buildRecoveredConfig('guild', [
    {
      channelId: 'main',
      isThread: false,
      regularCount: 2,
      livestreamCount: 0,
      latestMessageAt: 200,
      games: ['nap'],
      evidence: [
        { game: 'nap', roleId: 'role-a' },
        { game: 'nap', roleId: 'role-b' }
      ]
    },
    {
      channelId: 'live',
      isThread: false,
      regularCount: 0,
      livestreamCount: 1,
      latestMessageAt: 300,
      games: ['hkrpg'],
      evidence: [{ game: 'hkrpg', roleId: 'hsr-role' }]
    }
  ]);

  assert.deepStrictEqual(config, {
    guildId: 'guild',
    channel: 'main',
    livestreamChannel: 'live',
    hsrRole: 'hsr-role'
  });
});

test('restores game forum threads when no main channel evidence remains', () => {
  const config = buildRecoveredConfig('guild', [{
    channelId: 'zzz-thread',
    isThread: true,
    regularCount: 1,
    livestreamCount: 0,
    latestMessageAt: 100,
    games: ['nap'],
    evidence: [{ game: 'nap', roleId: 'zzz-role' }]
  }]);

  assert.deepStrictEqual(config, {
    guildId: 'guild',
    forumThreads: { zzz: 'zzz-thread' },
    zzzRole: 'zzz-role'
  });
});
