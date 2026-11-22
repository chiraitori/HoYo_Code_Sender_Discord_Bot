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
    if (Object.hasOwn(body, 'forumThreads')) {
        if (!isRecord(body.forumThreads)) return null;
        const threadPatch = {};
        for (const game of ['genshin', 'hsr', 'zzz']) {
            if (!Object.hasOwn(body.forumThreads, game)) continue;
            const value = body.forumThreads[game];
            if (value === null || value === '') threadPatch[game] = null;
            else if (typeof value === 'string' && /^\d{17,20}$/.test(value)) threadPatch[game] = value;
            else return null;
        }
        patch.forumThreads = threadPatch;
    }
    return patch;
}

function configPatchBelongsToGuild(patch, guild) {
    const roles = Array.isArray(guild?.roles) ? guild.roles : [];
    const channels = Array.isArray(guild?.channels) ? guild.channels : [];
    const threads = Array.isArray(guild?.threads) ? guild.threads : [];

    return Object.entries(patch).every(([field, value]) => {
        if (field === 'forumThreads') {
            if (!isRecord(value)) return false;
            return Object.values(value).every(threadId =>
                threadId === null || threads.some(item => item.id === threadId)
            );
        }
        if (value === null) return true;
        return (field.endsWith('Role') ? roles : channels).some(item => item.id === value);
    });
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

function getValidatedTestPayload(body) {
    if (body === undefined || body === null) return { game: null };
    if (!isRecord(body)) return null;
    if (!Object.hasOwn(body, 'game') || body.game === null || body.game === '') {
        return { game: null };
    }
    if (body.game === 'genshin' || body.game === 'hsr' || body.game === 'zzz') {
        return { game: body.game };
    }
    return null;
}

function getValidatedPostCodePayload(body) {
    if (!isRecord(body)) return null;
    const game = body.game;
    if (game !== 'genshin' && game !== 'hsr' && game !== 'zzz') return null;

    if (!Array.isArray(body.codes) || body.codes.length === 0 || body.codes.length > 3) {
        return null;
    }

    const codes = [];
    for (const rawCode of body.codes) {
        if (typeof rawCode !== 'string') return null;
        const normalized = rawCode.trim().toUpperCase();
        if (!/^[A-Z0-9_-]{3,32}$/.test(normalized)) return null;
        if (!codes.includes(normalized)) codes.push(normalized);
    }
    if (codes.length === 0) return null;

    let message = '';
    if (Object.hasOwn(body, 'message') && body.message !== null && body.message !== undefined) {
        if (typeof body.message !== 'string') return null;
        message = body.message.trim();
        if (message.length > 500) return null;
    }

    let mentionRole = true;
    if (Object.hasOwn(body, 'mentionRole') && body.mentionRole !== undefined) {
        if (typeof body.mentionRole !== 'boolean') return null;
        mentionRole = body.mentionRole;
    }

    let target = 'auto';
    if (Object.hasOwn(body, 'target') && body.target !== undefined && body.target !== null && body.target !== '') {
        if (body.target !== 'auto' && body.target !== 'channel' && body.target !== 'livestream' && body.target !== 'thread') {
            return null;
        }
        target = body.target;
    }

    return { game, codes, message, mentionRole, target };
}

module.exports = {
    getValidatedLanguage,
    getValidatedConfigPatch,
    configPatchBelongsToGuild,
    getValidatedSettingsPatch,
    getValidatedTestPayload,
    getValidatedPostCodePayload
};
