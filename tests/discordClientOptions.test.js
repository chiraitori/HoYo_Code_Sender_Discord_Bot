const assert = require('node:assert/strict');
const test = require('node:test');
const { GatewayIntentBits } = require('discord.js');
const {
    cacheLimits,
    createDiscordClientOptions,
    sweepers
} = require('../utils/discordClientOptions');

function createCache(managerName) {
    const options = createDiscordClientOptions();
    const manager = { name: managerName };
    return options.makeCache(manager, null, manager);
}

test('subscribes only to guild events required by slash commands', () => {
    const options = createDiscordClientOptions();

    assert.deepEqual(options.intents, [GatewayIntentBits.Guilds]);
    assert.equal(options.intents.includes(GatewayIntentBits.GuildMessages), false);
});

test('does not retain messages, reactions, presence, or voice state', () => {
    for (const managerName of [
        'MessageManager',
        'ReactionManager',
        'ReactionUserManager',
        'PresenceManager',
        'VoiceStateManager',
        'ThreadMemberManager'
    ]) {
        assert.equal(createCache(managerName).maxSize, 0, managerName);
    }
});

test('bounds member, user, and thread caches while retaining the bot identity', () => {
    assert.equal(cacheLimits.GuildMemberManager.maxSize, 25);
    assert.equal(cacheLimits.UserManager.maxSize, 500);
    assert.equal(cacheLimits.ThreadManager, 25);

    const client = { user: { id: 'bot-user' } };
    assert.equal(
        cacheLimits.GuildMemberManager.keepOverLimit({ id: 'bot-user', client }),
        true
    );
    assert.equal(
        cacheLimits.GuildMemberManager.keepOverLimit({ id: 'other-user', client }),
        false
    );
});

test('keeps short fallback sweepers for fetched messages and archived threads', () => {
    assert.deepEqual(sweepers.messages, { interval: 300, lifetime: 300 });
    assert.deepEqual(sweepers.threads, { interval: 900, lifetime: 3600 });
});
