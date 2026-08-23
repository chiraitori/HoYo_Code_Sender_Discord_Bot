const test = require('node:test');
const assert = require('node:assert/strict');
const {
    DEFAULT_SELF_MAINTENANCE_CONFIG,
    buildHealthSnapshot,
    createSelfMaintenance,
    getSelfMaintenanceConfig,
    shouldRunConfigRecovery
} = require('../utils/selfMaintenance');

function createClient({ ready = true, wsStatus = 0, ping = 42 } = {}) {
    return {
        isReady: () => ready,
        ws: { status: wsStatus, ping }
    };
}

function createMemoryUsage({ rssMb = 100, heapUsedMb = 50, heapTotalMb = 80 } = {}) {
    const mb = 1024 * 1024;
    return {
        rss: rssMb * mb,
        heapUsed: heapUsedMb * mb,
        heapTotal: heapTotalMb * mb
    };
}

test('buildHealthSnapshot reports a healthy Discord and MongoDB connection', () => {
    const snapshot = buildHealthSnapshot({
        client: createClient(),
        mongoReadyState: 1,
        memoryUsage: createMemoryUsage(),
        eventLoopLagMs: 10,
        shardIds: [0],
        now: 1_700_000_000_000
    });

    assert.equal(snapshot.status, 'ok');
    assert.equal(snapshot.healthy, true);
    assert.deepEqual(snapshot.reasons, []);
    assert.deepEqual(snapshot.shardIds, [0]);
});

test('buildHealthSnapshot includes every failed health signal', () => {
    const snapshot = buildHealthSnapshot({
        client: createClient({ ready: false, wsStatus: 5, ping: 20_000 }),
        mongoReadyState: 0,
        memoryUsage: createMemoryUsage({ rssMb: 500, heapUsedMb: 350 }),
        eventLoopLagMs: 6_000,
        config: DEFAULT_SELF_MAINTENANCE_CONFIG,
        now: 1_700_000_000_000
    });

    assert.equal(snapshot.status, 'degraded');
    assert.deepEqual(snapshot.reasons, [
        'discord_not_ready',
        'discord_ws_status_5',
        'mongodb_state_0',
        'rss_limit_exceeded',
        'heap_limit_exceeded',
        'event_loop_lag_exceeded',
        'discord_ping_limit_exceeded'
    ]);
});

test('getSelfMaintenanceConfig uses safe defaults and supports overrides', () => {
    const defaults = getSelfMaintenanceConfig({});
    assert.deepEqual(defaults, DEFAULT_SELF_MAINTENANCE_CONFIG);

    const overridden = getSelfMaintenanceConfig({
        SELF_MAINTENANCE_ENABLED: 'false',
        SELF_MAINTENANCE_INTERVAL_MS: '1500',
        SELF_MAINTENANCE_FAILURE_THRESHOLD: '5',
        SELF_MAINTENANCE_MAX_RSS_MB: '512'
    });
    assert.equal(overridden.enabled, false);
    assert.equal(overridden.intervalMs, 1500);
    assert.equal(overridden.failureThreshold, 5);
    assert.equal(overridden.maxRssMb, 512);
    assert.equal(overridden.maxHeapMb, DEFAULT_SELF_MAINTENANCE_CONFIG.maxHeapMb);
});

test('configuration recovery is opt-in and only runs when rows are missing', () => {
    const audit = { missingConfigGuildIds: ['123'] };
    assert.equal(shouldRunConfigRecovery(audit, {}), false);
    assert.equal(shouldRunConfigRecovery(audit, { CONFIG_AUTO_RECOVERY: 'false' }), false);
    assert.equal(shouldRunConfigRecovery(audit, { CONFIG_AUTO_RECOVERY: 'true' }), true);
    assert.equal(shouldRunConfigRecovery({ missingConfigGuildIds: [] }, { CONFIG_AUTO_RECOVERY: 'true' }), false);
});

test('watchdog waits for persistent failures and only triggers recovery once', async () => {
    let currentTime = 0;
    let ready = false;
    let recoveries = 0;
    const client = createClient({ ready: false });
    client.isReady = () => ready;
    const messages = [];
    const monitor = createSelfMaintenance({
        client,
        shardIds: [2],
        getMongoReadyState: () => 1,
        onUnhealthy: async () => { recoveries += 1; },
        config: {
            ...DEFAULT_SELF_MAINTENANCE_CONFIG,
            intervalMs: 100,
            startupGraceMs: 100,
            failureThreshold: 3
        },
        logger: {
            info: message => messages.push(message),
            warn: message => messages.push(message),
            error: message => messages.push(message)
        },
        now: () => currentTime,
        getMemoryUsage: () => createMemoryUsage(),
        autoStart: false
    });

    currentTime = 100;
    await monitor.check();
    currentTime = 200;
    await monitor.check();
    assert.equal(recoveries, 0);

    ready = true;
    currentTime = 300;
    await monitor.check();
    assert.equal(monitor.getSnapshot().maintenance.consecutiveFailures, 0);

    ready = false;
    currentTime = 400;
    await monitor.check();
    currentTime = 500;
    await monitor.check();
    currentTime = 600;
    await monitor.check();
    await monitor.check();

    assert.equal(recoveries, 1);
    assert.equal(monitor.getSnapshot().maintenance.recoveryTriggered, true);
    assert.ok(messages.some(message => message.includes('Restarting shard process')));
});
