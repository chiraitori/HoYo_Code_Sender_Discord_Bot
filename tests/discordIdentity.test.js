const test = require('node:test');
const assert = require('node:assert');

const { getDiscordIdentityError } = require('../utils/discordIdentity');

test('accepts a client ID that matches the logged-in bot', () => {
  assert.strictEqual(
    getDiscordIdentityError({ id: '123', tag: 'Test Bot' }, '123'),
    null
  );
});

test('reports a token and client ID mismatch', () => {
  assert.match(
    getDiscordIdentityError({ id: '123', tag: 'Test Bot' }, '456'),
    /DISCORD_TOKEN belongs to Test Bot \(123\), but CLIENT_ID is 456/
  );
});

test('reports missing identity information', () => {
  assert.match(getDiscordIdentityError(null, ''), /Unable to validate/);
});
