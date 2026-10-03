const test = require('node:test');
const assert = require('node:assert/strict');
const { NextRequest } = require('next/server');
const { loadTs } = require('./loadTs.cjs');
const { authorizeGuild, canManageGuild, getUserGuilds } = loadTs('lib/discordAuth.ts');
const serverId = '123456789012345678';
const realFetch = global.fetch;
const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const originalClientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
const origin = 'https://dashboard.example';
let fetchCalls;

test.beforeEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = origin;
  process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID = serverId;
  fetchCalls = [];
  global.fetch = async url => {
    fetchCalls.push(String(url));
    return Response.json([{ id: serverId, owner: false, permissions: '32' }]);
  };
});
test.afterEach(() => {
  global.fetch = realFetch;
  if (originalAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  if (originalClientId === undefined) delete process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  else process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID = originalClientId;
});

function request(method = 'GET', cookies = 'discord_access_token=test-token', requestOrigin = origin) {
  return new NextRequest(`${origin}/api/server/${serverId}/config`, {
    method, headers: { cookie: cookies, origin: requestOrigin, 'Content-Type': 'application/json' },
    ...(method === 'PUT' ? { body: JSON.stringify({ channel: null }) } : {})
  });
}

test('rejects unauthenticated, non-member, non-manager, and cross-origin mutations', async () => {
  assert.equal((await authorizeGuild(request('GET', ''), serverId)).status, 401);
  assert.equal(fetchCalls.length, 0);
  assert.equal((await authorizeGuild(request('PUT', undefined, 'https://intruder.example'), serverId)).status, 403);
  assert.equal(fetchCalls.length, 0);
  global.fetch = async () => Response.json([]);
  assert.equal((await authorizeGuild(request(), serverId)).status, 403);
  global.fetch = async () => Response.json([{ id: serverId, permissions: '0', owner: false }]);
  assert.equal((await authorizeGuild(request(), serverId)).status, 403);
});

test('validates live Discord permissions instead of trusting forged user cookie claims', async () => {
  assert.equal(await authorizeGuild(request('PUT'), serverId), null);
  global.fetch = async () => Response.json([{ id: serverId, permissions: '0', owner: false }]);
  const spoofed = `discord_user=${encodeURIComponent(JSON.stringify({ id: 'owner', owner: true, access_token: 'test-token' }))}`;
  assert.equal((await authorizeGuild(request('GET', spoofed), serverId)).status, 403);
  global.fetch = async () => new Response(null, { status: 401 });
  assert.equal((await authorizeGuild(request(), serverId)).status, 401);
});

test('every server proxy handler refuses anonymous calls before forwarding bot credentials', async () => {
  const routes = [
    ['app/api/server/[serverId]/config/route.ts', ['GET', 'PUT']],
    ['app/api/server/[serverId]/settings/route.ts', ['GET', 'PUT']],
    ['app/api/server/[serverId]/language/route.ts', ['GET', 'PUT']],
    ['app/api/server/[serverId]/reset/route.ts', ['POST']],
    ['app/api/server/[serverId]/test/route.ts', ['POST']],
    ['app/api/bot/guild/[guildId]/route.ts', ['GET']]
  ];
  for (const [file, methods] of routes) {
    const handlers = loadTs(file);
    for (const method of methods) {
      const response = await handlers[method](request(method, ''), {
        params: Promise.resolve({ serverId, guildId: serverId })
      });
      assert.equal(response.status, 401, `${file} ${method}`);
    }
  }
  assert.equal(fetchCalls.length, 0);
});

test('permission checks safely handle owners, admins, channel managers, and malformed permissions', () => {
  for (const permissions of ['8', '16', '32']) assert.equal(canManageGuild({ permissions, owner: false }), true);
  assert.equal(canManageGuild({ permissions: '0', owner: true }), true);
  assert.equal(canManageGuild({ permissions: 'bad', owner: false }), false);
});

test('guild lookup paginates and coalesces simultaneous permission checks', async () => {
  const firstPage = Array.from({ length: 200 }, (_, i) => ({ id: String(BigInt(serverId) + BigInt(i)), permissions: '0' }));
  global.fetch = async url => {
    fetchCalls.push(String(url));
    return Response.json(String(url).includes('after=') ? [{ id: 'last', permissions: '32' }] : firstPage);
  };
  const [a, b] = await Promise.all([getUserGuilds(request()), getUserGuilds(request())]);
  assert.equal(a.length, 201);
  assert.deepEqual(a, b);
  assert.equal(fetchCalls.length, 2);
});

test('concurrent permission failures return independently readable responses', async () => {
  global.fetch = async () => new Response(null, { status: 401 });
  const [a, b] = await Promise.all([getUserGuilds(request()), getUserGuilds(request())]);
  assert.equal(a.status, 401);
  assert.equal(b.status, 401);
  assert.deepEqual(await a.json(), await b.json());
});

test('login binds OAuth state to an HTTP-only cookie and callbacks reject missing or wrong state', async () => {
  const login = loadTs('app/auth/login/route.ts');
  const response = await login.GET(request());
  const location = new URL(response.headers.get('location'));
  assert.equal(location.searchParams.get('state'), response.cookies.get('discord_oauth_state').value);
  assert.match(response.headers.get('set-cookie'), /HttpOnly/i);
  const callback = loadTs('app/auth/callback/route.ts');
  const denied = await callback.GET(new NextRequest(`${origin}/auth/callback?code=abc&state=bad`));
  assert.match(denied.headers.get('location'), /invalid_oauth_state/);
  assert.equal(fetchCalls.length, 0);
});

test('logout removes both token and user cookies', async () => {
  const logout = loadTs('app/api/auth/logout/route.ts');
  const response = await logout.POST(request('POST'));
  assert.equal(response.cookies.get('discord_access_token').value, '');
  assert.equal(response.cookies.get('discord_user').value, '');
});
