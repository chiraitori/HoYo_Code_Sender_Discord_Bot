const test = require('node:test');
const assert = require('node:assert');

const {
  getValidatedLanguage, getValidatedConfigPatch,
  getValidatedSettingsPatch, configPatchBelongsToGuild
} = require('../utils/dashboardInput');

test('returns internal literals for supported dashboard languages', () => {
  assert.strictEqual(getValidatedLanguage('en'), 'en');
  assert.strictEqual(getValidatedLanguage('jp'), 'jp');
  assert.strictEqual(getValidatedLanguage('vi'), 'vi');
});

test('rejects malformed dashboard config values and safely clears selected channels', () => {
  for (const body of [null, [], 'false', { channel: { $ne: null } }, { zzzRole: 123 }, { channel: 'bad' }]) {
    assert.strictEqual(getValidatedConfigPatch(body), null);
  }
  assert.deepStrictEqual(getValidatedConfigPatch({ channel: '', zzzRole: null, guildId: 'ignored' }),
    { channel: null, zzzRole: null });
  assert.deepStrictEqual(getValidatedConfigPatch({ channel: '123456789012345678', hasOwnProperty: 'bad' }),
    { channel: '123456789012345678' });
});

test('channel and role configuration cannot reference another guild', () => {
  const guild = { roles: [{ id: 'role-a' }], channels: [{ id: 'channel-a' }] };
  assert.strictEqual(configPatchBelongsToGuild({ channel: 'channel-a', zzzRole: 'role-a' }, guild), true);
  assert.strictEqual(configPatchBelongsToGuild({ channel: 'channel-b' }, guild), false);
  assert.strictEqual(configPatchBelongsToGuild({ zzzRole: 'role-b' }, guild), false);
  assert.strictEqual(configPatchBelongsToGuild({ channel: null }, guild), true);
});

test('settings updates preserve partial values and reject non-boolean input', () => {
  assert.deepStrictEqual(getValidatedSettingsPatch({
    autoSendEnabled: false, autoSendOptions: { threads: false },
    favoriteGames: { games: { nap: false } }, livestreamAnnouncementsEnabled: false
  }), {
    autoSendEnabled: false, livestreamAnnouncementsEnabled: false,
    'autoSendOptions.threads': false, 'favoriteGames.games.nap': false
  });
  for (const body of [null, [], { autoSendEnabled: 'false' }, { favoriteGames: null },
    { favoriteGames: { games: { nap: 'false' } } }, { autoSendOptions: { channel: {} } }]) {
    assert.strictEqual(getValidatedSettingsPatch(body), null);
  }
});

test('rejects unsupported and non-string language input', () => {
  assert.strictEqual(getValidatedLanguage('$where'), null);
  assert.strictEqual(getValidatedLanguage({ $ne: null }), null);
  assert.strictEqual(getValidatedLanguage(undefined), null);
});

test('validates forumThreads snowflakes and guild ownership', () => {
  assert.deepStrictEqual(
    getValidatedConfigPatch({ forumThreads: { genshin: '123456789012345678', hsr: '', zzz: null } }),
    { forumThreads: { genshin: '123456789012345678', hsr: null, zzz: null } }
  );
  assert.strictEqual(getValidatedConfigPatch({ forumThreads: 'bad' }), null);
  assert.strictEqual(getValidatedConfigPatch({ forumThreads: { zzz: 'not-a-snowflake' } }), null);

  const guild = {
    roles: [],
    channels: [],
    threads: [{ id: '123456789012345678' }]
  };
  assert.strictEqual(
    configPatchBelongsToGuild({ forumThreads: { genshin: '123456789012345678', zzz: null } }, guild),
    true
  );
  assert.strictEqual(
    configPatchBelongsToGuild({ forumThreads: { genshin: '999999999999999999' } }, guild),
    false
  );
});
