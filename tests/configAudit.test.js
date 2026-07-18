const test = require('node:test');
const assert = require('node:assert');

const { getGuildConfigurationGaps } = require('../utils/configAudit');

test('finds connected guilds whose Config was deleted', () => {
  const audit = getGuildConfigurationGaps(
    new Set(['configured', 'missing-config']),
    [{ guildId: 'configured' }, { guildId: 'bot-left' }],
    [{ guildId: 'configured' }]
  );

  assert.deepStrictEqual(audit.missingConfigGuildIds, ['missing-config']);
  assert.deepStrictEqual(audit.disconnectedConfigGuildIds, ['bot-left']);
});

test('reports missing Settings without treating the guild as unconfigured', () => {
  const audit = getGuildConfigurationGaps(
    new Set(['legacy-guild']),
    [{ guildId: 'legacy-guild' }],
    []
  );

  assert.deepStrictEqual(audit.missingConfigGuildIds, []);
  assert.deepStrictEqual(audit.missingSettingsGuildIds, ['legacy-guild']);
});
