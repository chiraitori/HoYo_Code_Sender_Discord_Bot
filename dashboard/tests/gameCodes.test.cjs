const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./loadTs.cjs');
const { normalizeGameCodes, loadGameCodes } = loadTs('lib/gameCodes.ts');
const realFetch = global.fetch;
const originalUrl = process.env.MAIN_BOT_API_URL;
test.afterEach(() => {
  global.fetch = realFetch;
  if (originalUrl === undefined) delete process.env.MAIN_BOT_API_URL;
  else process.env.MAIN_BOT_API_URL = originalUrl;
});

test('expiry uses API status, explicit expiry, and offline timestamps', () => {
  const codes = normalizeGameCodes([
    { code: 'A', status: 'OK' }, { code: 'B', status: 'EXPIRED', isExpired: false },
    { code: 'C', isExpired: true }, { code: 'D', offlineAt: 100 },
    { code: 'E', status: 'OK', offline_at: 1000 }
  ], 200000);
  assert.deepEqual(codes.map(code => code.isExpired), [false, true, true, true, false]);
});

test('prefers the bot code API so HoYoLAB-only codes also appear on the web', async () => {
  process.env.MAIN_BOT_API_URL = 'https://bot.example/';
  const calls = [];
  global.fetch = async url => {
    calls.push(url);
    return Response.json({ codes: [{ code: 'HOYOLABONLY', status: 'OK' }] });
  };
  const codes = await loadGameCodes('zzz');
  assert.equal(codes[0].code, 'HOYOLABONLY');
  assert.deepEqual(calls, ['https://bot.example/api/codes/zzz']);
});

test('falls back to the external code API when the bot is unreachable', async () => {
  process.env.MAIN_BOT_API_URL = 'https://bot.example';
  const calls = [];
  global.fetch = async url => {
    calls.push(url);
    if (url.startsWith('https://bot.example')) throw new Error('Offline');
    return Response.json({ codes: [{ code: 'ACTIVE', status: 'OK' }] });
  };
  assert.equal((await loadGameCodes('hsr'))[0].code, 'ACTIVE');
  assert.equal(calls[1], 'https://hoyo-codes.seria.moe/codes?game=hkrpg');
});

test('a malformed or failed external response is not reported as an empty successful list', async () => {
  delete process.env.MAIN_BOT_API_URL;
  global.fetch = async () => Response.json({ error: 'Unavailable' });
  await assert.rejects(() => loadGameCodes('genshin'), /Invalid code API response/);
});
