const MB = 1024 * 1024;

const DEFAULT_SELF_MAINTENANCE_CONFIG = Object.freeze({
    enabled: true,
    intervalMs: 60_000,
    startupGraceMs: 120_000,
    failureThreshold: 3,
    maxRssMb: 400,
    maxHeapMb: 300,
    maxEventLoopLagMs: 5_000,
    maxDiscordPingMs: 10_000
});

function getPositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getSelfMaintenanceConfig(environment = process.env) {
    return {
        enabled: environment.SELF_MAINTENANCE_ENABLED !== 'false',
        intervalMs: getPositiveInteger(
            environment.SELF_MAINTENANCE_INTERVAL_MS,
            DEFAULT_SELF_MAINTENANCE_CONFIG.intervalMs
        ),
        startupGraceMs: getPositiveInteger(
            environment.SELF_MAINTENANCE_STARTUP_GRACE_MS,
            DEFAULT_SELF_MAINTENANCE_CONFIG.startupGraceMs
        ),
        failureThreshold: getPositiveInteger(
            environment.SELF_MAINTENANCE_FAILURE_THRESHOLD,
            DEFAULT_SELF_MAINTENANCE_CONFIG.failureThreshold
        ),
        maxRssMb: getPositiveInteger(
            environment.SELF_MAINTENANCE_MAX_RSS_MB,
            DEFAULT_SELF_MAINTENANCE_CONFIG.maxRssMb
        ),
        maxHeapMb: getPositiveInteger(
            environment.SELF_MAINTENANCE_MAX_HEAP_MB,
            DEFAULT_SELF_MAINTENANCE_CONFIG.maxHeapMb
        ),
        maxEventLoopLagMs: getPositiveInteger(
            environment.SELF_MAINTENANCE_MAX_EVENT_LOOP_LAG_MS,
            DEFAULT_SELF_MAINTENANCE_CONFIG.maxEventLoopLagMs
        ),
        maxDiscordPingMs: getPositiveInteger(
            environment.SELF_MAINTENANCE_MAX_DISCORD_PING_MS,
            DEFAULT_SELF_MAINTENANCE_CONFIG.maxDiscordPingMs
        )
    };
}

function round(value, decimals = 2) {
    const multiplier = 10 ** decimals;
    return Math.round(value * multiplier) / multiplier;
}

function buildHealthSnapshot({
    client,
    mongoReadyState,
    memoryUsage,
    eventLoopLagMs,
    shardIds = [],
    config = DEFAULT_SELF_MAINTENANCE_CONFIG,
    now = Date.now()
}) {
    const rssMb = memoryUsage.rss / MB;
    const heapUsedMb = memoryUsage.heapUsed / MB;
    const discordReady = Boolean(client?.isReady?.());
    const discordWsStatus = client?.ws?.status ?? null;
    const discordPingMs = client?.ws?.ping;
    const reasons = [];

    if (!discordReady) {
        reasons.push('discord_not_ready');
    }
    if (discordWsStatus !== 0) {
        reasons.push(`discord_ws_status_${discordWsStatus ?? 'unknown'}`);
    }
    if (mongoReadyState !== 1) {
        reasons.push(`mongodb_state_${mongoReadyState}`);
    }
    if (rssMb > config.maxRssMb) {
        reasons.push('rss_limit_exceeded');
    }
    if (heapUsedMb > config.maxHeapMb) {
        reasons.push('heap_limit_exceeded');
    }
    if (eventLoopLagMs > config.maxEventLoopLagMs) {
        reasons.push('event_loop_lag_exceeded');
    }
    if (Number.isFinite(discordPingMs) && discordPingMs > config.maxDiscordPingMs) {
        reasons.push('discord_ping_limit_exceeded');
    }

    return {
        status: reasons.length === 0 ? 'ok' : 'degraded',
        healthy: reasons.length === 0,
        checkedAt: new Date(now).toISOString(),
        shardIds,
        uptimeSeconds: round(process.uptime(), 1),
        discord: {
            ready: discordReady,
            wsStatus: discordWsStatus,
            pingMs: Number.isFinite(discordPingMs) ? discordPingMs : null
        },
        mongodb: {
            readyState: mongoReadyState,
            connected: mongoReadyState === 1
        },
        memoryMb: {
            rss: round(rssMb),
            heapUsed: round(heapUsedMb),
            heapTotal: round(memoryUsage.heapTotal / MB)
        },
        eventLoopLagMs: round(eventLoopLagMs),
        reasons
    };
}

function shouldRunConfigRecovery(configAudit, environment = process.env) {
    return Boolean(
        configAudit?.missingConfigGuildIds?.length > 0
        && environment.CONFIG_AUTO_RECOVERY === 'true'
    );
}

function createSelfMaintenance({
    client,
    shardIds = [],
    getMongoReadyState,
    onUnhealthy,
    config = getSelfMaintenanceConfig(),
    logger = console,
    now = Date.now,
    getMemoryUsage = process.memoryUsage,
    setIntervalFn = setInterval,
    clearIntervalFn = clearInterval,
    autoStart = true
}) {
    const startedAt = now();
    let expectedRunAt = startedAt + config.intervalMs;
    let consecutiveFailures = 0;
    let recoveryTriggered = false;
    let timer = null;
    let lastSnapshot = buildHealthSnapshot({
        client,
        mongoReadyState: getMongoReadyState(),
        memoryUsage: getMemoryUsage(),
        eventLoopLagMs: 0,
        shardIds,
        config,
        now: startedAt
    });

    function stop() {
        if (timer) {
            clearIntervalFn(timer);
            timer = null;
        }
    }

    async function check() {
        if (recoveryTriggered) {
            return lastSnapshot;
        }

        const checkedAt = now();
        const eventLoopLagMs = Math.max(0, checkedAt - expectedRunAt);
        expectedRunAt = checkedAt + config.intervalMs;
        lastSnapshot = buildHealthSnapshot({
            client,
            mongoReadyState: getMongoReadyState(),
            memoryUsage: getMemoryUsage(),
            eventLoopLagMs,
            shardIds,
            config,
            now: checkedAt
        });

        if (checkedAt - startedAt < config.startupGraceMs) {
            consecutiveFailures = 0;
            return lastSnapshot;
        }

        if (lastSnapshot.healthy) {
            if (consecutiveFailures > 0) {
                logger.info('[Self Maintenance] Health recovered before restart was needed');
            }
            consecutiveFailures = 0;
            return lastSnapshot;
        }

        consecutiveFailures += 1;
        logger.warn(
            `[Self Maintenance] Unhealthy check ${consecutiveFailures}/${config.failureThreshold}: `
            + lastSnapshot.reasons.join(', ')
        );

        if (consecutiveFailures >= config.failureThreshold) {
            recoveryTriggered = true;
            stop();
            logger.error(
                `[Self Maintenance] Restarting shard process after persistent failure: `
                + lastSnapshot.reasons.join(', ')
            );
            await onUnhealthy(lastSnapshot);
        }

        return lastSnapshot;
    }

    if (config.enabled && autoStart) {
        timer = setIntervalFn(() => {
            void check().catch(error => {
                logger.error('[Self Maintenance] Watchdog check failed:', error);
            });
        }, config.intervalMs);
        timer?.unref?.();
        logger.info(
            `[Self Maintenance] Started for shard(s) [${shardIds.join(', ')}] `
            + `(interval=${config.intervalMs}ms, failures=${config.failureThreshold})`
        );
    } else if (!config.enabled) {
        logger.warn('[Self Maintenance] Disabled by SELF_MAINTENANCE_ENABLED=false');
    }

    return {
        check,
        stop,
        getSnapshot() {
            return {
                ...lastSnapshot,
                maintenance: {
                    enabled: config.enabled,
                    consecutiveFailures,
                    failureThreshold: config.failureThreshold,
                    recoveryTriggered
                }
            };
        }
    };
}

module.exports = {
    DEFAULT_SELF_MAINTENANCE_CONFIG,
    buildHealthSnapshot,
    createSelfMaintenance,
    getSelfMaintenanceConfig,
    shouldRunConfigRecovery
};
