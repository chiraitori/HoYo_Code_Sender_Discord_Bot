'use strict';

const GAME_EMOJIS = Object.freeze({
    genshin: '<:genshin:1368073403231375430>',
    hkrpg: '<:hsr:1368073099756703794>',
    nap: '<:zzz:1368073452174704763>'
});

function formatGameTitle(game, title, { stripLeadingTv = false } = {}) {
    const fallbackEmoji = '\u{1F3AE}';
    const gameEmoji = GAME_EMOJIS[game] || fallbackEmoji;
    const normalizedTitle = stripLeadingTv
        ? String(title || '').replace(/^\u{1F4FA}\uFE0F?\s*/u, '')
        : String(title || '');

    return `${gameEmoji} ${normalizedTitle}`.trim();
}

module.exports = {
    GAME_EMOJIS,
    formatGameTitle
};
