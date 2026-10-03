const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./loadTs.cjs');
const { createBotApiResponse, getBotApiUrl } = loadTs('utils/botApiUrl.ts');
const realFetch = global.fetch;
const originalUrl = process.env.MAIN_BOT_API_URL;
const originalSecret = process.env.AUTH_BOT_SECRET;
const realConsoleError = console.error;

test.beforeEach(() => {
  process.env.MAIN_BOT_API_URL = 'https://private-bot.example:7893/internal';
  process.env.AUTH_BOT_SECRET = 'private-sentinel-secret';
  console.error = () => {};
});

test.afterEach(() => {
  global.fetch = realFetch;
  console.error = realConsoleError;
  if (originalUrl === undefined) delete process.env.MAIN_BOT_API_URL;
  else process.env.MAIN_BOT_API_URL = originalUrl;
  if (originalSecret === undefined) delete process.env.AUTH_BOT_SECRET;
  else process.env.AUTH_BOT_SECRET = originalSecret;
});

test('proxy responses redact backend URL, origin, hostname, and secret at every nesting level', async () => {
  const response = createBotApiResponse({
    normal: 'GENSHINGIFT',
    nested: ['https://private-bot.example:7893/internal/path', 'private-bot.example',
      { message: 'Bearer private-sentinel-secret', origin: 'https://private-bot.example:7893' }]
  });
  const text = await response.text();
  assert.ok(!text.includes('private-bot.example'));
  assert.ok(!text.includes('private-sentinel-secret'));
  assert.ok(text.includes('GENSHINGIFT'));
  assert.equal(response.headers.get('location'), null);
});

test('missing backend configuration cannot recursively fetch the dashboard on localhost', () => {
  delete process.env.MAIN_BOT_API_URL;
  assert.throws(() => getBotApiUrl(), /not configured/);
});

test('stats expose only selected public fields, not upstream debugging metadata', async () => {
  global.fetch = async () => Response.json({
    guildCount: 3, userCount: 20, status: 0,
    internalUrl: process.env.MAIN_BOT_API_URL,
    debug: { secret: process.env.AUTH_BOT_SECRET },
    botUser: { username: 'Bot', secret: process.env.AUTH_BOT_SECRET }
  }, { headers: { location: process.env.MAIN_BOT_API_URL } });
  const response = await loadTs('app/api/bot/stats/route.ts').GET();
  const data = await response.json();
  assert.equal(data.guildCount, 3);
  assert.equal(data.internalUrl, undefined);
  assert.equal(data.debug, undefined);
  assert.equal(data.botUser.secret, undefined);
  assert.equal(response.headers.get('location'), null);
});

test('public code error responses never echo fetch errors containing internal addresses or secrets', async () => {
  global.fetch = async () => { throw new Error(`${process.env.MAIN_BOT_API_URL} ${process.env.AUTH_BOT_SECRET}`); };
  const single = await loadTs('app/api/codes/[game]/route.ts').GET(undefined, {
    params: Promise.resolve({ game: 'zzz' })
  });
  const all = await loadTs('app/api/codes/route.ts').GET();
  for (const response of [single, all]) {
    const text = await response.text();
    assert.ok(!text.includes('private-bot.example'));
    assert.ok(!text.includes('private-sentinel-secret'));
  }
});
