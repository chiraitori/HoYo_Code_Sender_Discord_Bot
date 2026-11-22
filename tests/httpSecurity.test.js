const test = require('node:test');
const assert = require('node:assert');

const {
    parseTrustProxy,
    getAllowedOrigins,
    createCorsOptions,
    securityHeadersMiddleware,
    jsonBodyErrorHandler
} = require('../utils/httpSecurity');

test('parseTrustProxy defaults safely to 1 hop and supports explicit overrides', () => {
    assert.strictEqual(parseTrustProxy(undefined), 1);
    assert.strictEqual(parseTrustProxy(''), 1);
    assert.strictEqual(parseTrustProxy('true'), 1);
    assert.strictEqual(parseTrustProxy('false'), false);
    assert.strictEqual(parseTrustProxy('0'), false);
    assert.strictEqual(parseTrustProxy('2'), 2);
    assert.strictEqual(parseTrustProxy('loopback'), 'loopback');
});

test('CORS options allow server-to-server calls and listed origins while denying arbitrary browser origins', async () => {
    const env = {
        DASHBOARD_ALLOWED_ORIGINS: 'https://hoyo-dash.vercel.app/, http://localhost:5173, invalid-url'
    };
    const allowed = getAllowedOrigins(env);
    assert.deepStrictEqual(Array.from(allowed), ['https://hoyo-dash.vercel.app', 'http://localhost:5173']);

    const corsOpts = createCorsOptions(env);
    const checkOrigin = (origin) => new Promise((resolve, reject) => {
        corsOpts.origin(origin, (err, ok) => err ? reject(err) : resolve(ok));
    });

    assert.strictEqual(await checkOrigin(undefined), true);
    assert.strictEqual(await checkOrigin('https://hoyo-dash.vercel.app'), true);
    assert.strictEqual(await checkOrigin('http://localhost:5173'), true);
    assert.strictEqual(await checkOrigin('https://evil.example'), false);
});

test('securityHeadersMiddleware sets strict headers and no-store on protected API paths', () => {
    const headers = {};
    const res = { setHeader(k, v) { headers[k.toLowerCase()] = v; } };
    let nextCalled = false;

    securityHeadersMiddleware({
        path: '/api/server/123456789012345678/snapshot',
        secure: false,
        headers: { 'x-forwarded-proto': 'https' }
    }, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(headers['x-frame-options'], 'DENY');
    assert.strictEqual(headers['x-content-type-options'], 'nosniff');
    assert.strictEqual(headers['cache-control'], 'no-store, private');
    assert.match(headers['strict-transport-security'], /max-age=31536000/);
    assert.match(headers['permissions-policy'], /camera=\(\)/);
});

test('jsonBodyErrorHandler cleanly handles malformed JSON and oversized payloads', () => {
    const makeRes = () => ({
        code: 200,
        payload: null,
        status(c) { this.code = c; return this; },
        json(p) { this.payload = p; return this; }
    });

    const syntaxErr = new SyntaxError('Unexpected token');
    syntaxErr.status = 400;
    syntaxErr.body = '{bad';
    const res1 = makeRes();
    jsonBodyErrorHandler(syntaxErr, {}, res1, () => {});
    assert.strictEqual(res1.code, 400);

    const res2 = makeRes();
    jsonBodyErrorHandler({ type: 'entity.too.large' }, {}, res2, () => {});
    assert.strictEqual(res2.code, 413);
});
