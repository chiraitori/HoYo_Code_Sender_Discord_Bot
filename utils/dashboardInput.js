'use strict';

function getValidatedLanguage(rawLanguage) {
    switch (rawLanguage) {
        case 'en':
            return 'en';
        case 'jp':
            return 'jp';
        case 'vi':
            return 'vi';
        default:
            return null;
    }
}

function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getValidatedConfigPatch(body) {
    if (!isRecord(body)) return null;
    const patch = {};
    for (const field of ['genshinRole', 'hsrRole', 'zzzRole', 'channel', 'livestreamChannel']) {
        if (!Object.hasOwn(body, field)) continue;
        const value = body[field];
        if (value === null || value === '') patch[field] = null;
        else if (typeof value === 'string' && /^\d{17,20}$/.test(value)) patch[field] = value;
        else return null;
    }
    return patch;
}

function configPatchBelongsToGuild(patch, guild) {
    return Object.entries(patch).every(([field, value]) => (
        value === null || (field.endsWith('Role') ? guild.roles : guild.channels)
            .some(item => item.id === value)
    ));
}

function getValidatedSettingsPatch(body) {
    if (!isRecord(body)) return null;
    const patch = {};
    for (const field of ['autoSendEnabled', 'livestreamAnnouncementsEnabled']) {
        if (!Object.hasOwn(body, field)) continue;
        if (typeof body[field] !== 'boolean') return null;
        patch[field] = body[field];
    }
    if (Object.hasOwn(body, 'autoSendOptions')) {
        if (!isRecord(body.autoSendOptions)) return null;
        for (const key of ['channel', 'threads']) {
            if (!Object.hasOwn(body.autoSendOptions, key)) continue;
            if (typeof body.autoSendOptions[key] !== 'boolean') return null;
            patch[`autoSendOptions.${key}`] = body.autoSendOptions[key];
        }
    }
    if (Object.hasOwn(body, 'favoriteGames')) {
        const favorites = body.favoriteGames;
        if (!isRecord(favorites)) return null;
        if (Object.hasOwn(favorites, 'enabled')) {
            if (typeof favorites.enabled !== 'boolean') return null;
            patch['favoriteGames.enabled'] = favorites.enabled;
        }
        if (Object.hasOwn(favorites, 'games')) {
            if (!isRecord(favorites.games)) return null;
            for (const game of ['genshin', 'hkrpg', 'nap']) {
                if (!Object.hasOwn(favorites.games, game)) continue;
                if (typeof favorites.games[game] !== 'boolean') return null;
                patch[`favoriteGames.games.${game}`] = favorites.games[game];
            }
        }
    }
    return patch;
}

module.exports = {
    getValidatedLanguage,
    getValidatedConfigPatch,
    configPatchBelongsToGuild,
    getValidatedSettingsPatch
};
