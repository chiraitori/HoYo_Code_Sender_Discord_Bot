const test = require('node:test');
const assert = require('node:assert');

// Set the owner id before requiring the module.
const OWNER_ID = '999000999';
process.env.OWNER_ID = OWNER_ID;
delete require.cache[require.resolve('../utils/permissions')];
const { isOwner, hasAdminPermission } = require('../utils/permissions');

test('isOwner returns true only for the configured OWNER_ID', () => {
  assert.strictEqual(isOwner(OWNER_ID), true);
  assert.strictEqual(isOwner('123'), false);
  assert.strictEqual(isOwner(undefined), false);
});

function makeInteraction({ userId, hasAdmin, noPerms = false }) {
  return {
    user: { id: userId },
    memberPermissions: noPerms ? undefined : { has: () => hasAdmin },
  };
}

test('hasAdminPermission grants access to the bot owner even without admin perms', () => {
  const interaction = makeInteraction({ userId: OWNER_ID, hasAdmin: false });
  assert.strictEqual(hasAdminPermission(interaction), true);
});

test('hasAdminPermission grants access to guild admins', () => {
  const interaction = makeInteraction({ userId: '111', hasAdmin: true });
  assert.strictEqual(hasAdminPermission(interaction), true);
});

test('hasAdminPermission denies non-admin users', () => {
  const interaction = makeInteraction({ userId: '111', hasAdmin: false });
  assert.strictEqual(hasAdminPermission(interaction), false);
});

test('hasAdminPermission denies when memberPermissions is undefined', () => {
  const interaction = makeInteraction({ userId: '111', hasAdmin: false, noPerms: true });
  assert.strictEqual(hasAdminPermission(interaction), false);
});
