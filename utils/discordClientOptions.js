const { GatewayIntentBits, Options } = require('discord.js');

const cacheLimits = {
    ...Options.DefaultMakeCacheSettings,
    MessageManager: 0,
    ReactionManager: 0,
    ReactionUserManager: 0,
    PresenceManager: 0,
    VoiceStateManager: 0,
    ThreadMemberManager: 0,
    ThreadManager: 25,
    GuildMemberManager: {
        maxSize: 25,
        keepOverLimit: member => member.id === member.client.user?.id
    },
    UserManager: {
        maxSize: 500,
        keepOverLimit: user => user.id === user.client.user?.id
    }
};

const sweepers = {
    ...Options.DefaultSweeperSettings,
    messages: {
        interval: 300,
        lifetime: 300
    },
    threads: {
        interval: 900,
        lifetime: 3600
    }
};

function createDiscordClientOptions() {
    return {
        // Slash commands and outbound messages only need guild events. Listening
        // for every guild message filled per-channel caches without any consumer.
        intents: [GatewayIntentBits.Guilds],
        makeCache: Options.cacheWithLimits(cacheLimits),
        sweepers
    };
}

module.exports = {
    cacheLimits,
    createDiscordClientOptions,
    sweepers
};
