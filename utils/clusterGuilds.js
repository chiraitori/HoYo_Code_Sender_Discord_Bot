'use strict';

function isShardingInProcessError(error) {
    return error?.code === 'ShardingInProcess'
        || error?.name === 'ShardingInProcess'
        || error?.message?.includes('Shards are still being spawned');
}

function wait(delayMs) {
    return new Promise(resolve => setTimeout(resolve, delayMs));
}

async function broadcastEvalWhenReady(
    client,
    evaluator,
    {
        maxAttempts = 60,
        retryDelayMs = 1000,
        context = undefined
    } = {}
) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await client.shard.broadcastEval(
                evaluator,
                context === undefined ? undefined : { context }
            );
        } catch (error) {
            if (!isShardingInProcessError(error)) {
                throw error;
            }

            lastError = error;
            if (attempt === 1 || attempt % 10 === 0) {
                console.log(
                    `[ShardManager] Waiting for all shards before cross-shard work `
                    + `(${attempt}/${maxAttempts})...`
                );
            }
            if (attempt < maxAttempts) {
                await wait(retryDelayMs);
            }
        }
    }

    throw lastError;
}

async function getKnownGuildIds(client, retryOptions = undefined) {
    if (!client?.shard) {
        return new Set(client?.guilds?.cache?.keys?.() || []);
    }

    const guildIdsByShard = await broadcastEvalWhenReady(
        client,
        shardClient => Array.from(shardClient.guilds.cache.keys()),
        retryOptions
    );

    return new Set(guildIdsByShard.flat());
}

module.exports = {
    getKnownGuildIds,
    broadcastEvalWhenReady,
    isShardingInProcessError
};
