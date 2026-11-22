const test = require('node:test');
const assert = require('node:assert');

const {
    signDashboardRequest,
    createNonceStore,
    createEdgeSecretMiddleware,
    createDashboardAuthMiddleware,
    timingSafeEqualString
} = require('../utils/dashboardBridge');

function createMockRes() {
    const headers = {};
    let statusCode = 200;
    let body = null;
    return {
        headers,
        get statusCode() { return statusCode; },
        get body() { return body; },
        setHeader(k, v) { headers[k.toLowerCase()] = v; },
        status(code) { statusCode = code; return this; },
        json(payload) { body = payload; return this; }
    };
}

test('timingSafeEqualString matches equal strings and rejects unequal strings of any length', () => {
    assert.strictEqual(timingSafeEqualString('super-secret-value-1234', 'super-secret-value-1234'), true);
    assert.strictEqual(timingSafeEqualString('super-secret-value-1234', 'super-secret-value-1235'), false);
    assert.strictEqual(timingSafeEqualString('short', 'much-longer-secret'), false);
    assert.strictEqual(timingSafeEqualString(null, 'secret'), false);
});

test('accepts valid HMAC-SHA256 signed requests and populates dashboardAuth metadata', () => {
    const secret = 'test-secret-with-at-least-32-characters-long';
    const nowMs = 1_700_000_000_000;
    const middleware = createDashboardAuthMiddleware({
        getEnv: () => ({ AUTH_BOT_SECRET: secret, DASHBOARD_AUTH_MODE: 'hmac' }),
        now: () => nowMs,
        nonceStore: createNonceStore()
    });

    const rawBody = Buffer.from(JSON.stringify({ channel: '123456789012345678' }), 'utf8');
    const signedHeaders = signDashboardRequest({
        secret,
        method: 'PUT',
        path: '/api/server/123456789012345678/config',
        body: rawBody,
        timestamp: Math.floor(nowMs / 1000),
        nonce: 'nonce_1234567890abcdef',
        actor: '998877665544332211',
        requestId: 'req-abc-123'
    });

    const req = {
        method: 'PUT',
        originalUrl: '/api/server/123456789012345678/config',
        path: '/api/server/123456789012345678/config',
        rawBody,
        headers: Object.fromEntries(Object.entries(signedHeaders).map(([k, v]) => [k.toLowerCase(), v]))
    };
    const res = createMockRes();
    let called = false;

    middleware(req, res, () => { called = true; });

    assert.strictEqual(called, true);
    assert.strictEqual(res.headers['x-request-id'], 'req-abc-123');
    assert.deepStrictEqual(req.dashboardAuth, {
        mode: 'hmac',
        rotatedKey: false,
        actor: '998877665544332211',
        requestId: 'req-abc-123'
    });
});

test('rejects tampered body, tampered path, and replayed nonces', () => {
    const secret = 'test-secret-with-at-least-32-characters-long';
    const nowMs = 1_700_000_000_000;
    const nonceStore = createNonceStore();
    const middleware = createDashboardAuthMiddleware({
        getEnv: () => ({ AUTH_BOT_SECRET: secret, DASHBOARD_AUTH_MODE: 'hmac' }),
        now: () => nowMs,
        nonceStore
    });

    const rawBody = Buffer.from(JSON.stringify({ language: 'en' }), 'utf8');
    const signedHeaders = signDashboardRequest({
        secret,
        method: 'PUT',
        path: '/api/server/123456789012345678/language',
        body: rawBody,
        timestamp: Math.floor(nowMs / 1000),
        nonce: 'unique_nonce_998877665544'
    });
    const lowerHeaders = Object.fromEntries(Object.entries(signedHeaders).map(([k, v]) => [k.toLowerCase(), v]));

    // 1. Tampered body must fail and NOT consume the nonce
    const tamperedBodyRes = createMockRes();
    let tamperedBodyNext = false;
    middleware({
        method: 'PUT',
        originalUrl: '/api/server/123456789012345678/language',
        rawBody: Buffer.from(JSON.stringify({ language: 'jp' }), 'utf8'),
        headers: lowerHeaders
    }, tamperedBodyRes, () => { tamperedBodyNext = true; });
    assert.strictEqual(tamperedBodyNext, false);
    assert.strictEqual(tamperedBodyRes.statusCode, 401);

    // 2. Tampered path must fail
    const tamperedPathRes = createMockRes();
    middleware({
        method: 'PUT',
        originalUrl: '/api/server/999999999999999999/language',
        rawBody,
        headers: lowerHeaders
    }, tamperedPathRes, () => {});
    assert.strictEqual(tamperedPathRes.statusCode, 401);

    // 3. Valid request succeeds once
    const validRes = createMockRes();
    let validNext = false;
    middleware({
        method: 'PUT',
        originalUrl: '/api/server/123456789012345678/language',
        rawBody,
        headers: lowerHeaders
    }, validRes, () => { validNext = true; });
    assert.strictEqual(validNext, true);

    // 4. Exact replay of the same nonce fails
    const replayRes = createMockRes();
    let replayNext = false;
    middleware({
        method: 'PUT',
        originalUrl: '/api/server/123456789012345678/language',
        rawBody,
        headers: lowerHeaders
    }, replayRes, () => { replayNext = true; });
    assert.strictEqual(replayNext, false);
    assert.strictEqual(replayRes.statusCode, 401);
    assert.match(replayRes.body.message, /Replayed/i);
});

test('rejects expired timestamps and supports zero-downtime key rotation via AUTH_BOT_SECRET_PREVIOUS', () => {
    const oldSecret = 'old-secret-before-rotation-32-chars-min';
    const newSecret = 'new-secret-after-rotation-32-chars-min';
    const nowMs = 1_700_000_000_000;

    const middleware = createDashboardAuthMiddleware({
        getEnv: () => ({
            AUTH_BOT_SECRET: newSecret,
            AUTH_BOT_SECRET_PREVIOUS: oldSecret,
            DASHBOARD_AUTH_MODE: 'hmac',
            DASHBOARD_MAX_SKEW_SECONDS: '30'
        }),
        now: () => nowMs,
        nonceStore: createNonceStore()
    });

    // Expired timestamp
    const expiredHeaders = signDashboardRequest({
        secret: newSecret,
        method: 'GET',
        path: '/api/bot/ping',
        timestamp: Math.floor(nowMs / 1000) - 90,
        nonce: 'expired_nonce_1234567890'
    });
    const expRes = createMockRes();
    middleware({
        method: 'GET',
        originalUrl: '/api/bot/ping',
        headers: Object.fromEntries(Object.entries(expiredHeaders).map(([k, v]) => [k.toLowerCase(), v]))
    }, expRes, () => {});
    assert.strictEqual(expRes.statusCode, 401);

    // Signed with previous secret during rotation window
    const rotatedHeaders = signDashboardRequest({
        secret: oldSecret,
        method: 'GET',
        path: '/api/bot/ping',
        timestamp: Math.floor(nowMs / 1000),
        nonce: 'rotated_nonce_1234567890'
    });
    const req = {
        method: 'GET',
        originalUrl: '/api/bot/ping',
        headers: Object.fromEntries(Object.entries(rotatedHeaders).map(([k, v]) => [k.toLowerCase(), v]))
    };
    const rotRes = createMockRes();
    let passed = false;
    middleware(req, rotRes, () => { passed = true; });
    assert.strictEqual(passed, true);
    assert.strictEqual(req.dashboardAuth.rotatedKey, true);
});

test('enforces strict hmac mode vs hybrid bearer fallback', () => {
    const secret = 'hybrid-mode-secret-32-characters-long';

    const strictMiddleware = createDashboardAuthMiddleware({
        getEnv: () => ({ AUTH_BOT_SECRET: secret, DASHBOARD_AUTH_MODE: 'hmac' })
    });
    const strictRes = createMockRes();
    strictMiddleware({
        method: 'GET',
        originalUrl: '/api/bot/stats',
        headers: { authorization: `Bearer ${secret}` }
    }, strictRes, () => {});
    assert.strictEqual(strictRes.statusCode, 401);

    const hybridMiddleware = createDashboardAuthMiddleware({
        getEnv: () => ({ AUTH_BOT_SECRET: secret, DASHBOARD_AUTH_MODE: 'hybrid' })
    });
    const hybridReq = {
        method: 'GET',
        originalUrl: '/api/bot/stats',
        headers: { authorization: `Bearer ${secret}` }
    };
    const hybridRes = createMockRes();
    let hybridPassed = false;
    hybridMiddleware(hybridReq, hybridRes, () => { hybridPassed = true; });
    assert.strictEqual(hybridPassed, true);
    assert.strictEqual(hybridReq.dashboardAuth.mode, 'bearer');
});

test('edge secret middleware blocks requests without matching X-Edge-Secret when configured', () => {
    const edgeMiddleware = createEdgeSecretMiddleware({
        getEnv: () => ({ VPS_EDGE_SECRET: 'cloudflare-tunnel-edge-secret-999' })
    });

    const deniedRes = createMockRes();
    let deniedNext = false;
    edgeMiddleware({ headers: {} }, deniedRes, () => { deniedNext = true; });
    assert.strictEqual(deniedNext, false);
    assert.strictEqual(deniedRes.statusCode, 403);

    const okRes = createMockRes();
    let okNext = false;
    edgeMiddleware({ headers: { 'x-edge-secret': 'cloudflare-tunnel-edge-secret-999' } }, okRes, () => { okNext = true; });
    assert.strictEqual(okNext, true);
});
