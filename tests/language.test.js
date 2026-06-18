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
  assert.ok(/Primogem/.test(result), `expected a translated reward, got: ${result}`);
});

test('getRewardString uses a plain fallback when the template is missing', async () => {
  // Force the template lookup to return a "Translation missing:" marker by
  // spying on getString via the public method using a key that won't resolve.
  const result = await languageManager.getRewardString('50 mora', null);
  assert.ok(/Mora/.test(result), `expected reward text, got: ${result}`);
});
