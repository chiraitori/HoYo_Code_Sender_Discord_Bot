const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('utils/bot.js routes postcodeModal submissions to the postcode command', () => {
  const botSource = fs.readFileSync(path.join(__dirname, '..', 'utils', 'bot.js'), 'utf8');
  assert.ok(botSource.includes("interaction.customId === 'postcodeModal'"));
  assert.ok(botSource.includes("client.commands.get('postcode')"));
  assert.equal(botSource.includes("interaction.customId === 'redeemModal'"), false);
});

test('postcode command normalizes nap/hkrpg aliases and uses official ZZZ redemption URL', async () => {
  const sentPayloads = [];
  const replies = [];

  const configModulePath = require.resolve('../models/Config');
  const previousConfigCache = require.cache[configModulePath];
  require.cache[configModulePath] = {
    id: configModulePath,
    filename: configModulePath,
    loaded: true,
    exports: {
      findOne: () => ({
        sort: async () => ({
          guildId: '123456789012345678',
          channel: '223456789012345678',
          zzzRole: '323456789012345678'
        })
      })
    }
  };

  const languageManager = require('../utils/language');
  languageManager.languageCache.set('123456789012345678', {
    language: 'en',
    timestamp: Date.now()
  });

  const postcodePath = require.resolve('../commands/postcode');
  delete require.cache[postcodePath];
  const postcode = require('../commands/postcode');

  try {
    const channel = {
      isThread: () => false,
      permissionsFor: () => ({ has: () => true }),
      send: async payload => { sentPayloads.push(payload); }
    };
    const interaction = {
      guildId: '123456789012345678',
      user: { id: '999999999999999999' },
      memberPermissions: { has: () => true },
      guild: {
        id: '123456789012345678',
        members: { me: {} },
        channels: {
          cache: new Map([['223456789012345678', channel]])
        }
      },
      fields: {
        getTextInputValue: key => ({
          game: 'nap',
          code1: 'zzzgift1',
          code2: '',
          code3: '',
          message: 'Test note'
        }[key])
      },
      reply: async payload => { replies.push(payload); }
    };

    await postcode.modalSubmit(interaction);

    assert.equal(sentPayloads.length, 1);
    const embedJson = sentPayloads[0].embeds[0].toJSON();
    assert.ok(embedJson.title.includes('Zenless Zone Zero'));
    assert.ok(embedJson.description.includes('https://zenless.hoyoverse.com/redemption?code=ZZZGIFT1'));
    assert.equal(sentPayloads[0].content, '<@&323456789012345678>');
    assert.deepEqual(sentPayloads[0].allowedMentions, { roles: ['323456789012345678'] });
    assert.equal(replies.length, 1);
  } finally {
    languageManager.clearGuildCache('123456789012345678');
    delete require.cache[postcodePath];
    if (previousConfigCache) {
      require.cache[configModulePath] = previousConfigCache;
    } else {
      delete require.cache[configModulePath];
    }
  }
});
