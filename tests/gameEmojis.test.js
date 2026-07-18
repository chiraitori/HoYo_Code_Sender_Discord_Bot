const test = require('node:test');
const assert = require('node:assert');

const { GAME_EMOJIS, formatGameTitle } = require('../utils/gameEmojis');

test('uses the same custom game emojis as regular code notifications', () => {
  assert.deepStrictEqual(GAME_EMOJIS, {
    genshin: '<:genshin:1368073403231375430>',
    hkrpg: '<:hsr:1368073099756703794>',
    nap: '<:zzz:1368073452174704763>'
  });
});

test('formats livestream code titles with the game emoji', () => {
  assert.strictEqual(
    formatGameTitle('nap', 'Zenless Zone Zero Livestream Codes'),
    '<:zzz:1368073452174704763> Zenless Zone Zero Livestream Codes'
  );
});

test('replaces the generic TV icon in announcement titles', () => {
  assert.strictEqual(
    formatGameTitle('hkrpg', '📺 Honkai: Star Rail Special Program Announced!', {
      stripLeadingTv: true
    }),
    '<:hsr:1368073099756703794> Honkai: Star Rail Special Program Announced!'
  );
});
