'use strict';

const rateLimit = require('express-rate-limit');

function parseTrustProxy(rawValue = process.env.TRUST_PROXY) {
    if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
        return 1;
    }

    const normalized = String(rawValue).trim().toLowerCase();
    if (normalized === 'false' || normalized === '0' || normalized === 'off') {
        return false;
    }
    if (/^\d+$/.test(normalized)) {
        return Number.parseInt(normalized, 10);
    }
    if (normalized === 'true') {
        // Avoid trusting arbitrary spoofed proxy chains; default to 1 hop when someone writes "true".
        return 1;
    }
    // Support explicit proxy subnets / names (e.g. "loopback", "127.0.0.1, 10.0.0.0/8").
    return String(rawValue).trim();
}

function getAllowedOrigins(env = process.env) {
    const raw = env.DASHBOARD_ALLOWED_ORIGINS || '';
    const origins = new Set();

    for (const part of String(raw).split(',')) {
        const candidate = part.trim();
        if (!candidate) continue;
        try {
            const parsed = new URL(candidate);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                origins.add(parsed.origin);
            }
        } catch {
            // Ignore malformed origin entries
        }
    }

    return origins;
}

function createCorsOptions(env = process.env) {
    const allowedOrigins = getAllowedOrigins(env);

    return {
        origin(origin, callback) {
            // Server-to-server requests (Vercel serverless/edge, health checks, curl) have no Origin header.
            if (!origin) {
                return callback(null, true);
            }
            if (allowedOrigins.has(origin)) {
                return callback(null, true);
            }
            return callback(null, false);
        },
        methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Dashboard-Timestamp',
            'X-Dashboard-Nonce',
            'X-Dashboard-Signature',
            'X-Dashboard-Actor',
            'X-Request-Id',
            'X-Edge-Secret'
        ],
        exposedHeaders: ['X-Request-Id', 'ETag', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
        maxAge: 600
    };
}

function securityHeadersMiddleware(req, res, next) {
    res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
        "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com",
        "img-src 'self' data: https: pic.re",
        "connect-src 'self'"
    ].join('; '));

    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');

    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    if (req.path.startsWith('/api/bot') || req.path.startsWith('/api/server')) {
        res.setHeader('Cache-Control', 'no-store, private');
    }

    next();
}

function createPublicLimiter(env = process.env) {
    const parsedMax = Number.parseInt(env.PUBLIC_RATE_LIMIT_MAX, 10);
    const max = Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : 120;

    return rateLimit({
        windowMs: 60 * 1000,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too Many Requests', message: 'Rate limit exceeded. Please try again shortly.' },
        validate: { xForwardedForHeader: false }
    });
}

function createDashboardApiLimiter(env = process.env) {
    const parsedMax = Number.parseInt(env.DASHBOARD_RATE_LIMIT_MAX, 10);
    const max = Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : 300;

    return rateLimit({
        windowMs: 60 * 1000,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        // Key by verified Discord actor when present so Vercel's shared egress IPs
        // do not throttle unrelated guild admins.
        keyGenerator: (req) => {
            if (req.dashboardAuth?.actor) {
                return `actor:${req.dashboardAuth.actor}`;
            }
            if (req.params?.serverId) {
                return `server:${req.params.serverId}`;
            }
            return `ip:${req.ip}`;
        },
        message: { error: 'Too Many Requests', message: 'Dashboard API rate limit exceeded.' },
        validate: { xForwardedForHeader: false }
    });
}

function createServerActionLimiter({ windowMs, max, message }) {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => `action:${req.params?.serverId || req.ip}`,
        message: { error: 'Too Many Requests', message },
        validate: { xForwardedForHeader: false }
    });
}

function jsonBodyErrorHandler(err, req, res, next) {
    if (!err) return next();

    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Payload Too Large', message: 'Request body exceeds 64KB limit' });
    }
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Bad Request', message: 'Malformed JSON body' });
    }

    return next(err);
}

function logDashboardAudit(req, action, details = {}) {
    const entry = {
        ts: new Date().toISOString(),
        requestId: req.requestId || req.dashboardAuth?.requestId || null,
        authMode: req.dashboardAuth?.mode || 'unknown',
        actor: req.dashboardAuth?.actor || null,
        action,
        ...details
    };
    console.log(`[Dashboard Audit] ${JSON.stringify(entry)}`);
}

module.exports = {
    parseTrustProxy,
    getAllowedOrigins,
    createCorsOptions,
    securityHeadersMiddleware,
    createPublicLimiter,
    createDashboardApiLimiter,
    createServerActionLimiter,
    jsonBodyErrorHandler,
    logDashboardAudit
};
