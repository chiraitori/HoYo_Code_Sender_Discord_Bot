require('dotenv').config();

const path = require('path');
const { setTimeout: sleep } = require('timers/promises');
const {
    ShardingManager,
    fetchRecommendedShardCount
} = require('discord.js');

const token = process.env.DISCORD_TOKEN;

if (!token) {
    console.error('Missing DISCORD_TOKEN. Unable to start the shard manager.');
    process.exit(1);
}

function parsePositiveInteger(value, fallback = null) {
    const parsed = Number.parseInt(value || '', 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseShardList(value) {
    if (!value?.trim()) {
        return null;
    }

    const shardIds = value
        .split(',')
        .map(id => Number.parseInt(id.trim(), 10))
        .filter(Number.isInteger)
        .filter(id => id >= 0);

    return shardIds.length > 0 ? [...new Set(shardIds)] : null;
}

const configuredShardCount = parsePositiveInteger(process.env.SHARD_COUNT);
const configuredShardList = parseShardList(process.env.SHARD_IDS);
const guildsPerShard = parsePositiveInteger(process.env.SHARD_GUILDS_PER_SHARD, 1000);
const spawnDelay = parsePositiveInteger(process.env.SHARD_SPAWN_DELAY_MS, 5500);
const spawnTimeout = parsePositiveInteger(process.env.SHARD_SPAWN_TIMEOUT_MS, 60000);
const rescaleInterval = parsePositiveInteger(
    process.env.SHARD_RESCALE_INTERVAL_MS,
    30 * 60 * 1000
);
const rebalanceDelay = parsePositiveInteger(
    process.env.SHARD_REBALANCE_DELAY_MS,
    2000
);

if (configuredShardList && !configuredShardCount) {
    console.error('SHARD_COUNT is required when SHARD_IDS is configured.');
    process.exit(1);
}

if (
    configuredShardList
    && configuredShardList.some(shardId => shardId >= configuredShardCount)
) {
    console.error('Every SHARD_IDS value must be lower than SHARD_COUNT.');
    process.exit(1);
}

let manager = null;
let currentShardCount = 0;
let rebalancing = false;

async function getDesiredShardCount() {
    if (configuredShardCount) {
        return configuredShardCount;
    }

    return fetchRecommendedShardCount(token, { guildsPerShard });
}

function attachManagerLogging(nextManager) {
    nextManager.on('shardCreate', shard => {
        console.log(`[Sharding] Launching shard ${shard.id}`);

        shard.on('ready', () => {
            console.log(`[Sharding] Shard ${shard.id} ready`);
        });

        shard.on('death', processInfo => {
            console.error(
                `[Sharding] Shard ${shard.id} died`
                + (processInfo?.exitCode !== null ? ` (exit ${processInfo.exitCode})` : '')
            );
        });

        shard.on('error', error => {
            console.error(`[Sharding] Shard ${shard.id} error:`, error);
        });
    });
}

async function createAndSpawnManager(shardCount) {
    const nextManager = new ShardingManager(path.join(__dirname, 'index.js'), {
        token,
        totalShards: shardCount,
        shardList: configuredShardList || 'auto',
        mode: 'process',
        respawn: true
    });

    attachManagerLogging(nextManager);
    await nextManager.spawn({
        amount: shardCount,
        delay: spawnDelay,
        timeout: spawnTimeout
    });

    return nextManager;
}

async function rebalanceShards(nextShardCount) {
    if (rebalancing || nextShardCount === currentShardCount) {
        return;
    }

    rebalancing = true;
    console.log(
        `[Sharding] Recommended shard count changed: ${currentShardCount} -> ${nextShardCount}. Rebalancing...`
    );

    const previousManager = manager;
    if (previousManager) {
        previousManager.respawn = false;
        for (const shard of previousManager.shards.values()) {
            shard.kill();
        }
        previousManager.shards.clear();
        await sleep(rebalanceDelay);
    }

    try {
        manager = await createAndSpawnManager(nextShardCount);
        currentShardCount = nextShardCount;
        console.log(`[Sharding] Rebalance complete with ${currentShardCount} shard(s)`);
    } catch (error) {
        console.error('[Sharding] Rebalance failed:', error);
        process.exit(1);
    } finally {
        rebalancing = false;
    }
}

async function start() {
    currentShardCount = await getDesiredShardCount();
    console.log(
        `[Sharding] Starting ${currentShardCount} shard(s)`
        + (configuredShardCount ? ' from SHARD_COUNT' : ` at ${guildsPerShard} guilds/shard`)
    );

    manager = await createAndSpawnManager(currentShardCount);

    if (!configuredShardCount && !configuredShardList) {
        const timer = setInterval(async () => {
            try {
                const recommendedShardCount = await getDesiredShardCount();
                await rebalanceShards(recommendedShardCount);
            } catch (error) {
                console.error('[Sharding] Failed to refresh recommended shard count:', error.message);
            }
        }, rescaleInterval);
        timer.unref();
    }
}

start().catch(error => {
    console.error('[Sharding] Failed to start:', error);
    process.exit(1);
});

let shuttingDown = false;
async function shutdown(signal) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    console.log(`[Sharding] Received ${signal}; stopping shard workers...`);

    if (manager) {
        manager.respawn = false;
        for (const shard of manager.shards.values()) {
            shard.kill();
        }
    }

    await sleep(500);
    process.exit(0);
}

process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
});
process.once('SIGINT', () => {
    void shutdown('SIGINT');
});
