'use strict';

async function getKnownGuildIds(client) {
    if (!client?.shard) {
        return new Set(client?.guilds?.cache?.keys?.() || []);
    }

    const guildIdsByShard = await client.shard.broadcastEval(shardClient =>
        Array.from(shardClient.guilds.cache.keys())
    );

    return new Set(guildIdsByShard.flat());
}

module.exports = {
    getKnownGuildIds
};
