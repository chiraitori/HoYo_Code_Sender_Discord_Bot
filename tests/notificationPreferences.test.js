const test = require('node:test');
const assert = require('node:assert');

const {
  shouldSendGameNotifications
} = require('../utils/notificationPreferences');

test('sends all games when settings do not exist', () => {
  assert.strictEqual(shouldSendGameNotifications(undefined, 'genshin'), true);
  assert.strictEqual(shouldSendGameNotifications(undefined, 'hkrpg'), true);
  assert.strictEqual(shouldSendGameNotifications(undefined, 'nap'), true);
});

test('sends all games when favorite games are not enabled', () => {
  const settings = {
    autoSendEnabled: true,
    favoriteGames: {
      enabled: false,
      games: { genshin: false, hkrpg: false, nap: false }
    }
  };

  assert.strictEqual(shouldSendGameNotifications(settings, 'nap'), true);
});

test('follows each game flag when favorite games are enabled', () => {
  const settings = {
    autoSendEnabled: true,
    favoriteGames: {
      enabled: true,
      games: { genshin: true, hkrpg: false, nap: true }
    }
  };

  assert.strictEqual(shouldSendGameNotifications(settings, 'genshin'), true);
  assert.strictEqual(shouldSendGameNotifications(settings, 'hkrpg'), false);
  assert.strictEqual(shouldSendGameNotifications(settings, 'nap'), true);
});

test('autoSendEnabled false disables every game', () => {
  assert.strictEqual(
    shouldSendGameNotifications({ autoSendEnabled: false }, 'nap'),
    false
  );
});
