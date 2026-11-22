'use strict';

const crypto = require('crypto');

const SIGNATURE_VERSION = 'v1';
const DEFAULT_MAX_SKEW_SECONDS = 60;
const MAX_NONCE_CACHE_SIZE = 10_000;
const DISCORD_SNOWFLAKE_REGEX = /^\d{17,20}$/;
const SAFE_REQUEST_ID_REGEX = /^[a-zA-Z0-9._-]{4,64}$/;
const SAFE_NONCE_REGEX = /^[a-zA-Z0-9._-]{16,128}$/;

function timingSafeEqualString(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }

    const digestA = crypto.createHash('sha256').update(a, 'utf8').digest();
    const digestB = crypto.createHash('sha256').update(b, 'utf8').digest();
    // Compare both fixed-size digests and exact lengths so timing does not leak secret length.
    return crypto.timingSafeEqual(digestA, digestB) && a.length === b.length;
}

function sha256Hex(rawBody) {
    if (Buffer.isBuffer(rawBody)) {
        return crypto.createHash('sha256').update(rawBody).digest('hex');
    }
    if (typeof rawBody === 'string') {
        return crypto.createHash('sha256').update(rawBody, 'utf8').digest('hex');
    }
    return crypto.createHash('sha256').update('').digest('hex');
}

function buildCanonicalPayload({ method, path, timestamp, nonce, rawBody }) {
    const normalizedMethod = String(method || 'GET').toUpperCase();
    const normalizedPath = String(path || '/');
    const bodyHash = sha256Hex(rawBody);
    return `${normalizedMethod}\n${normalizedPath}\n${timestamp}\n${nonce}\n${bodyHash}`;
}

function computeHmacSignature(secret, payload) {
    const mac = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');
    return `${SIGNATURE_VERSION}=${mac}`;
}

/**
 * Signs a dashboard -> bot HTTP request using HMAC-SHA256 with timestamp & nonce.
 */
function signDashboardRequest({
    secret,
    method = 'GET',
    path = '/',
    body = '',
    timestamp = Math.floor(Date.now() / 1000),
    nonce = crypto.randomBytes(16).toString('hex'),
    actor = null,
    requestId = crypto.randomUUID(),
    edgeSecret = null
}) {
    if (!secret) {
        throw new Error('AUTH_BOT_SECRET is required to sign dashboard requests');
    }

    const rawBody = Buffer.isBuffer(body)
        ? body
        : (typeof body === 'string' ? body : (body ? JSON.stringify(body) : ''));

    const ts = String(timestamp);
    const canonical = buildCanonicalPayload({
        method,
        path,
        timestamp: ts,
        nonce,
        rawBody
    });
    const signature = computeHmacSignature(secret, canonical);

    const headers = {
        'X-Dashboard-Timestamp': ts,
        'X-Dashboard-Nonce': nonce,
        'X-Dashboard-Signature': signature,
        'X-Request-Id': requestId
    };

    if (actor && DISCORD_SNOWFLAKE_REGEX.test(String(actor))) {
        headers['X-Dashboard-Actor'] = String(actor);
    }
    if (edgeSecret) {
        headers['X-Edge-Secret'] = edgeSecret;
    }

    return headers;
}

function getConfiguredSecrets(env = process.env) {
    const secrets = [];
    if (typeof env.AUTH_BOT_SECRET === 'string' && env.AUTH_BOT_SECRET.trim()) {
        secrets.push(env.AUTH_BOT_SECRET.trim());
    }
    if (typeof env.AUTH_BOT_SECRET_PREVIOUS === 'string' && env.AUTH_BOT_SECRET_PREVIOUS.trim()) {
        secrets.push(env.AUTH_BOT_SECRET_PREVIOUS.trim());
    }
    return secrets;
}

function getAuthMode(env = process.env) {
    const raw = String(env.DASHBOARD_AUTH_MODE || 'hybrid').trim().toLowerCase();
    return raw === 'hmac' ? 'hmac' : 'hybrid';
}

function getMaxSkewSeconds(env = process.env) {
    const parsed = Number.parseInt(env.DASHBOARD_MAX_SKEW_SECONDS, 10);
    if (Number.isFinite(parsed) && parsed >= 5 && parsed <= 600) {
        return parsed;
    }
    return DEFAULT_MAX_SKEW_SECONDS;
}

function extractRequestId(req) {
    const raw = req.headers?.['x-request-id'];
    if (typeof raw === 'string' && SAFE_REQUEST_ID_REGEX.test(raw.trim())) {
        return raw.trim();
    }
    return crypto.randomUUID();
}

function extractActor(req) {
    const raw = req.headers?.['x-dashboard-actor'];
    if (typeof raw === 'string' && DISCORD_SNOWFLAKE_REGEX.test(raw.trim())) {
        return raw.trim();
    }
    return null;
}

function createNonceStore() {
    const seen = new Map(); // nonce -> expiresAtMs

    function prune(nowMs) {
        for (const [nonce, expiresAt] of seen.entries()) {
            if (expiresAt <= nowMs) {
                seen.delete(nonce);
            }
        }
        if (seen.size > MAX_NONCE_CACHE_SIZE) {
            const overflow = seen.size - MAX_NONCE_CACHE_SIZE;
            let removed = 0;
            for (const key of seen.keys()) {
                seen.delete(key);
                removed++;
                if (removed >= overflow) break;
            }
        }
    }

    return {
        consume(nonce, ttlMs, nowMs = Date.now()) {
            prune(nowMs);
            if (seen.has(nonce)) {
                return false;
            }
            seen.set(nonce, nowMs + ttlMs);
            return true;
        },
        size() {
            return seen.size;
        },
        clear() {
            seen.clear();
        }
    };
}

/**
 * Optional edge secret middleware for VPS deployments behind Cloudflare / nginx / Vercel.
 * When VPS_EDGE_SECRET is set, requires matching X-Edge-Secret header.
 */
function createEdgeSecretMiddleware(options = {}) {
    const getEnv = options.getEnv || (() => process.env);

    return (req, res, next) => {
        const env = getEnv();
        const expected = typeof env.VPS_EDGE_SECRET === 'string' ? env.VPS_EDGE_SECRET.trim() : '';
        if (!expected) {
            return next();
        }

        const provided = req.headers?.['x-edge-secret'];
        if (typeof provided !== 'string' || !timingSafeEqualString(provided, expected)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Missing or invalid edge gateway secret'
            });
        }

        return next();
    };
}

/**
 * Express authentication middleware for protected dashboard -> bot endpoints.
 * Supports:
 *  - HMAC-SHA256 signed requests (X-Dashboard-Timestamp, X-Dashboard-Nonce, X-Dashboard-Signature)
 *  - Timing-safe Bearer token fallback when DASHBOARD_AUTH_MODE=hybrid (default)
 *  - Zero-downtime secret rotation via AUTH_BOT_SECRET_PREVIOUS
 */
function createDashboardAuthMiddleware(options = {}) {
    const getEnv = options.getEnv || (() => process.env);
    const nowFn = options.now || (() => Date.now());
    const nonceStore = options.nonceStore || createNonceStore();

    return (req, res, next) => {
        const requestId = extractRequestId(req);
        res.setHeader('X-Request-Id', requestId);
        req.requestId = requestId;

        // Public codes endpoints do not require dashboard auth
        const fullPath = req.originalUrl || req.path || '';
        if (fullPath === '/api/codes' || fullPath.startsWith('/api/codes?') || fullPath.startsWith('/api/codes/')) {
            return next();
        }

        const env = getEnv();
        const secrets = getConfiguredSecrets(env);
        if (secrets.length === 0) {
            console.error('AUTH_BOT_SECRET environment variable is not set');
            return res.status(500).json({
                error: 'Internal Server Error',
                message: 'Authentication not configured'
            });
        }

        const authMode = getAuthMode(env);
        const actor = extractActor(req);

        // 1. Check HMAC-SHA256 signed headers first
        const signatureHeader = req.headers?.['x-dashboard-signature'];
        const timestampHeader = req.headers?.['x-dashboard-timestamp'];
        const nonceHeader = req.headers?.['x-dashboard-nonce'];

        if (signatureHeader || timestampHeader || nonceHeader) {
            if (
                typeof signatureHeader !== 'string' ||
                typeof timestampHeader !== 'string' ||
                typeof nonceHeader !== 'string'
            ) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Incomplete signed request headers'
                });
            }

            if (!SAFE_NONCE_REGEX.test(nonceHeader)) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Invalid request nonce format'
                });
            }

            const timestampSec = Number(timestampHeader);
            const maxSkew = getMaxSkewSeconds(env);
            const nowMs = nowFn();
            const nowSec = Math.floor(nowMs / 1000);
            if (!Number.isInteger(timestampSec) || Math.abs(nowSec - timestampSec) > maxSkew) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Signed request timestamp is expired or out of range'
                });
            }

            const rawBody = req.rawBody !== undefined
                ? req.rawBody
                : (req.body && Object.keys(req.body).length > 0 ? JSON.stringify(req.body) : '');

            const canonical = buildCanonicalPayload({
                method: req.method,
                path: req.originalUrl || req.url || req.path,
                timestamp: timestampHeader,
                nonce: nonceHeader,
                rawBody
            });

            const matchedSecretIndex = secrets.findIndex(secret =>
                timingSafeEqualString(signatureHeader, computeHmacSignature(secret, canonical))
            );

            if (matchedSecretIndex === -1) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Invalid request signature'
                });
            }

            // Consume nonce only after signature is proven valid so attackers cannot pollute the nonce store.
            const ttlMs = (maxSkew * 2 + 10) * 1000;
            if (!nonceStore.consume(nonceHeader, ttlMs, nowMs)) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Replayed request nonce detected'
                });
            }

            req.dashboardAuth = {
                mode: 'hmac',
                rotatedKey: matchedSecretIndex > 0,
                actor,
                requestId
            };
            return next();
        }

        // 2. Reject static Bearer tokens if strict HMAC mode is enabled
        if (authMode === 'hmac') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'HMAC signed dashboard headers are required'
            });
        }

        // 3. Hybrid fallback: timing-safe Bearer token validation
        const authHeader = req.headers?.authorization;
        if (!authHeader) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authorization header is required'
            });
        }

        if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid authorization format. Use Bearer token or HMAC signature'
            });
        }

        const token = authHeader.slice(7);
        const matchedIndex = secrets.findIndex(secret => timingSafeEqualString(token, secret));
        if (matchedIndex === -1) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid API key'
            });
        }

        req.dashboardAuth = {
            mode: 'bearer',
            rotatedKey: matchedIndex > 0,
            actor,
            requestId
        };
        return next();
    };
}

module.exports = {
    SIGNATURE_VERSION,
    timingSafeEqualString,
    sha256Hex,
    buildCanonicalPayload,
    computeHmacSignature,
    signDashboardRequest,
    createNonceStore,
    createEdgeSecretMiddleware,
    createDashboardAuthMiddleware
};
