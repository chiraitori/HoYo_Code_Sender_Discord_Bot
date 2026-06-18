// TODO: refactor this mess before Ganyu gets disappointed
require('dotenv').config();
const { ShardingManager } = require('discord.js');
const path = require('path');

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
// Discord recommends ~2500 guilds per shard. When the bot grows past the
// current capacity we perform a full restart so `totalShards: 'auto'`
// re-queries the gateway and spawns the right number of shards.
const RESHARD_CHECK_INTERVAL = 60 * 60 * 1000; // every hour
const GUILDS_PER_SHARD = 2500;
const RESHARD_THRESHOLD = 0.8; // trigger when 80% full

async function checkReshardNeeded() {
    try {
        const guildCounts = await manager.fetchClientValues('guilds.cache.size');
        const totalGuilds = guildCounts.reduce((sum, count) => sum + count, 0);
        const currentShards = manager.totalShards;
        const capacity = currentShards * GUILDS_PER_SHARD;
        const usage = totalGuilds / capacity;

        console.log(
            `[AutoScale] ${totalGuilds} guilds across ${currentShards} shard(s) ` +
            `(${Math.round(usage * 100)}% capacity)`
        );

        if (usage >= RESHARD_THRESHOLD) {
            const recommended = Math.ceil(totalGuilds / GUILDS_PER_SHARD);
            if (recommended > currentShards) {
                // By default, only warn — resharding requires restarting all shards.
                // Set AUTO_RESHARD=true to allow automatic rolling restarts.
                if (process.env.AUTO_RESHARD === 'true') {
                    console.log(
                        `[AutoScale] 🔄 Resharding: ${currentShards} → ${recommended} shard(s) ` +
                        `(${totalGuilds} guilds exceed ${Math.round(RESHARD_THRESHOLD * 100)}% threshold)`
                    );
                    await manager.respawnAll({
                        shardDelay: 5500,   // stagger restarts so bot stays partially online
                        respawnDelay: 500,
                        timeout: 30000
                    });
                    console.log('[AutoScale] ✅ Reshard complete');
                } else {
                    console.warn(
                        `[AutoScale] ⚠️  Reshard recommended: ${currentShards} → ${recommended} shard(s) ` +
                        `(${totalGuilds} guilds, ${Math.round(usage * 100)}% capacity). ` +
                        `Restart the bot to apply, or set AUTO_RESHARD=true to auto-reshard.`
                    );
                }
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
        await manager.spawn({ timeout: 60000 });
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
