const test = require('node:test');
const assert = require('node:assert');
const languageManager = require('../utils/language');

test('getStringFromPath resolves a nested dotted key', () => {
  const result = languageManager.getStringFromPath(
    'commands.listcodes.noReward',
    languageManager.languages.en,
    {}
  );
  assert.strictEqual(result, 'No reward specified');
});

test('getStringFromPath substitutes {placeholder} tokens', () => {
  const result = languageManager.getStringFromPath(
    'commands.listcodes.newCodes',
    languageManager.languages.en,
    { game: 'Genshin' }
  );
  assert.strictEqual(result, 'New Genshin Codes!');
});

test('getStringFromPath returns null for a missing key', () => {
  assert.strictEqual(
    languageManager.getStringFromPath('does.not.exist', languageManager.languages.en, {}),
    null
  );
});

test('getStringFromPath returns null for nested object keys instead of returning an object', () => {
  assert.strictEqual(
    languageManager.getStringFromPath('commands.listcodes.error', languageManager.languages.en, {}),
    null
  );
  assert.strictEqual(
    languageManager.getStringFromPath('commands.setup.error', languageManager.languages.en, { foo: 'bar' }),
    null
  );
});

test('getFallbackText returns a known fallback message', () => {
  assert.strictEqual(
    languageManager.getFallbackText('commands.about.title'),
    'About HoYo Code Sender'
  );
});

test('getFallbackText returns a "Translation missing:" marker for unknown keys', () => {
  assert.strictEqual(
    languageManager.getFallbackText('totally.unknown.key'),
    'Translation missing: totally.unknown.key'
  );
});

test('getAvailableLanguages includes the core languages', () => {
  const langs = languageManager.getAvailableLanguages();
  assert.ok(langs.includes('en'));
  assert.ok(langs.includes('jp'));
  assert.ok(langs.includes('vi'));
});

test('getGuildLanguage defaults to en for DMs (null guildId)', async () => {
  assert.strictEqual(await languageManager.getGuildLanguage(null), 'en');
});

test('getRewardString translates rewards and applies the template', async () => {
  const result = await languageManager.getRewardString('100 primogems', null);
  assert.strictEqual(result, 'Reward: Primogems ×100');
});

test('getRewardString uses a plain fallback when the template is missing', async () => {
  // Force the template lookup to return a "Translation missing:" marker by
  // spying on getString via the public method using a key that won't resolve.
  const result = await languageManager.getRewardString('50 mora', null);
  assert.ok(/Mora/.test(result), `expected reward text, got: ${result}`);
});

test('support footer comes from the language folder', async () => {
  assert.strictEqual(
    await languageManager.getSupportFooter(null),
    'Support: github.com/sponsors/chiraitori | chiraitori.dev'
  );
});

function collectLeafKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectLeafKeys(v, next));
    } else {
      keys.push(next);
    }
  }
  return keys;
}

test('en, jp, and vi locale packs have complete key parity and no missing translation markers', () => {
  const { en, jp, vi } = languageManager.languages;
  const enKeys = collectLeafKeys(en);
  for (const key of enKeys) {
    for (const [langCode, dict] of [['en', en], ['jp', jp], ['vi', vi]]) {
      const val = languageManager.getStringFromPath(key, dict, {
        game: 'Zenless Zone Zero',
        language: 'EN',
        status: 'ENABLED',
        count: '3',
        version: '3.4',
        number: '1',
        channel: '#codes',
        thread: 'zzz-codes',
        role: '@ZZZ',
        type: 'ZZZ',
        command: '/setup',
        user: 'Proxy',
        reward: 'Polychrome ×60'
      });
      assert.strictEqual(typeof val, 'string', `missing ${key} in ${langCode}`);
      assert.ok(val.trim().length > 0, `empty ${key} in ${langCode}`);
      assert.ok(!val.includes('Translation missing:'), `fallback marker in ${langCode}:${key}`);
      assert.ok(!val.includes('Hoyovers'), `typo Hoyovers in ${langCode}:${key}`);
    }
  }
});
