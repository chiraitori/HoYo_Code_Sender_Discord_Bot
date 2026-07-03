// TODO: refactor this mess before Ganyu gets disappointed
require('dotenv').config();
const { ShardingManager, fetchRecommendedShardCount } = require('discord.js');
const path = require('path');
const { setTimeout: sleep } = require('timers/promises');
const { calculateReshardTarget } = require('./utils/resharding');

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
    console.error('❌ DISCORD_TOKEN is required');
    process.exit(1);
}

// ── Shard Manager ──────────────────────────────────────────────────────
const manager = new ShardingManager(path.join(__dirname, 'utils', 'bot.js'), {
    token: TOKEN,
    totalShards: 'auto',        // Discord API decides shard count (~1 per 2500 guilds)
    respawn: true               // Auto-restart crashed shards
});

// ── Logging ────────────────────────────────────────────────────────────
manager.on('shardCreate', shard => {
    console.log(`[ShardManager] Shard ${shard.id} launched (PID will follow)`);

    shard.on('ready', () => {
        console.log(`[ShardManager] Shard ${shard.id} ready`);
    });

    shard.on('disconnect', () => {
        console.warn(`[ShardManager] ⚠️  Shard ${shard.id} disconnected`);
    });

    shard.on('reconnecting', () => {
        console.log(`[ShardManager] Shard ${shard.id} reconnecting...`);
    });

    shard.on('death', process => {
        console.error(`[ShardManager] ❌ Shard ${shard.id} died (exit ${process.exitCode})`);
    });

    shard.on('error', error => {
        console.error(`[ShardManager] Shard ${shard.id} error:`, error);
    });
});

// ── Auto-Reshard ───────────────────────────────────────────────────────
// The manager auto-picks the startup shard count. The hourly check can grow
// the shard set from Discord's recommendation or from the local capacity target.
const RESHARD_CHECK_INTERVAL = 60 * 60 * 1000; // every hour
const GUILDS_PER_SHARD = 2500;
const RESHARD_THRESHOLD = 0.8; // trigger when 80% full
const RESHARD_DELAY = 5500;
const RESHARD_TIMEOUT = 60000;
const MAX_SPAWN_RETRIES = 5;

function getRetryAfterMs(error) {
    const retryAfter = error?.headers?.get?.('retry-after');
    const retryAfterSeconds = Number(retryAfter);

    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
        return Math.ceil(retryAfterSeconds * 1000);
    }

    return null;
}

async function spawnWithRetry(options) {
    for (let attempt = 1; attempt <= MAX_SPAWN_RETRIES; attempt += 1) {
        try {
            return await manager.spawn(options);
        } catch (error) {
            const retryAfterMs = getRetryAfterMs(error);

            if (error?.status !== 429 || !retryAfterMs || attempt === MAX_SPAWN_RETRIES) {
                throw error;
            }

            const delayMs = retryAfterMs + 1000;
            console.warn(
                `[ShardManager] Gateway rate limited while spawning; retrying in ${delayMs}ms ` +
                `(attempt ${attempt}/${MAX_SPAWN_RETRIES})`
            );
            await sleep(delayMs);
        }
    }
}

async function reshardTo(targetShards) {
    console.log(`[AutoScale] Stopping ${manager.shards.size} shard(s) before resharding...`);
    for (const [, shard] of manager.shards) {
        shard.kill();
    }

    manager.shards.clear();
    manager.totalShards = targetShards;
    manager.shardList = [...Array(targetShards).keys()];

    console.log(`[AutoScale] Spawning ${targetShards} shard(s)...`);
    await spawnWithRetry({
        amount: targetShards,
        delay: RESHARD_DELAY,
        timeout: RESHARD_TIMEOUT
    });
}

async function checkReshardNeeded() {
    try {
        const guildCounts = await manager.fetchClientValues('guilds.cache.size');
        const totalGuilds = guildCounts.reduce((sum, count) => sum + count, 0);
        const currentShards = manager.totalShards;
        const capacity = currentShards * GUILDS_PER_SHARD;
        const usage = totalGuilds / capacity;
        let discordRecommended = 0;
        try {
            discordRecommended = await fetchRecommendedShardCount(TOKEN);
        } catch (error) {
            console.warn('[AutoScale] Could not fetch Discord shard recommendation:', error.message || error.status);
        }
        const recommended = calculateReshardTarget({
            totalGuilds,
            currentShards,
            guildsPerShard: GUILDS_PER_SHARD,
            threshold: RESHARD_THRESHOLD,
            discordRecommended
        });

        console.log(
            `[AutoScale] ${totalGuilds} guilds across ${currentShards} shard(s) ` +
            `(${Math.round(usage * 100)}% capacity, target ${recommended})`
        );

        if (recommended > currentShards) {
            if (process.env.AUTO_RESHARD === 'true') {
                console.log(
                    `[AutoScale] Resharding: ${currentShards} -> ${recommended} shard(s) ` +
                    `(${totalGuilds} guilds, Discord recommends ${discordRecommended})`
                );
                await reshardTo(recommended);
                console.log('[AutoScale] Reshard complete');
            } else {
                console.warn(
                    `[AutoScale] Reshard recommended: ${currentShards} -> ${recommended} shard(s) ` +
                    `(${totalGuilds} guilds, ${Math.round(usage * 100)}% capacity, ` +
                    `Discord recommends ${discordRecommended}). ` +
                    `Restart the bot to apply, or set AUTO_RESHARD=true to auto-reshard.`
                );
            }
        }
    } catch (error) {
        console.error('[AutoScale] Error during reshard check:', error.message);
    }
}
// ── Start ──────────────────────────────────────────────────────────────
(async () => {
    try {
        console.log('[ShardManager] Spawning shards (totalShards: auto)...');
        await spawnWithRetry({ timeout: RESHARD_TIMEOUT });
        console.log(`[ShardManager] ✅ All ${manager.totalShards} shard(s) launched`);

        // Start periodic reshard check
        setInterval(checkReshardNeeded, RESHARD_CHECK_INTERVAL);
    } catch (error) {
        console.error('[ShardManager] Failed to spawn shards:', error);
        process.exit(1);
    }
})();

// ── Graceful Shutdown ──────────────────────────────────────────────────
let shuttingDown = false;
async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`[ShardManager] Received ${signal}; shutting down all shards...`);
    try {
        for (const [, shard] of manager.shards) {
            shard.kill();
        }
    } catch (error) {
        console.error('[ShardManager] Error during shutdown:', error.message);
    }
    process.exit(0);
}

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
