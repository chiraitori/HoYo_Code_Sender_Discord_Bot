'use strict';

const { PermissionFlagsBits } = require('discord.js');
const Config = require('../models/Config');
const Settings = require('../models/Settings');
const { broadcastEvalWhenReady } = require('./clusterGuilds');

const GAME_PATTERNS = {
    genshin: /\bgenshin(?: impact)?\b/i,
    hkrpg: /\b(?:honkai(?:\s*:\s*|\s+)star rail|star rail|hsr|hkrpg)\b/i,
    nap: /\b(?:zenless(?: zone zero)?|zzz|nap)\b/i
};

const CHANNEL_NAME_PATTERN = /code|game|hoyo|genshin|honkai|star.?rail|zenless|zzz|reward|promo|update|bot/i;
const CODE_PATTERN = /\bcodes?\b|m[aã]\s+code/i;
const REDEEM_PATTERN = /redeem|click to redeem|nh[aấ]n [dđ]ể nhận|\?code=|hoyoverse\.com\/(?:[^\s)]*\/)?(?:gift|redemption)/i;
const LIVESTREAM_PATTERN = /livestream|live stream|special program/i;

function getEmbedText(embed) {
    const fields = Array.isArray(embed?.fields) ? embed.fields : [];
    return [
        embed?.title,
        embed?.description,
        embed?.footer?.text,
        ...fields.flatMap(field => [field?.name, field?.value])
    ].filter(Boolean).join('\n');
}

function detectGames(text) {
    return Object.entries(GAME_PATTERNS)
        .filter(([, pattern]) => pattern.test(text))
        .map(([game]) => game);
}

function getMentionedRoleIds(message) {
    const roleIds = new Set();
    const mentionedRoles = message?.mentions?.roles;

    if (mentionedRoles?.keys) {
        for (const roleId of mentionedRoles.keys()) {
            roleIds.add(roleId);
        }
    } else if (Array.isArray(mentionedRoles)) {
        for (const role of mentionedRoles) {
            if (role?.id) roleIds.add(role.id);
        }
    }

    for (const match of String(message?.content || '').matchAll(/<@&(\d+)>/g)) {
        roleIds.add(match[1]);
    }

    return [...roleIds];
}

function getCodeNotificationEvidence(message, botUserId) {
    if (!message || message.author?.id !== botUserId) {
        return null;
    }

    const embedText = (message.embeds || []).map(getEmbedText).join('\n');
    const text = `${message.content || ''}\n${embedText}`;
    const games = detectGames(text);
    const hasCodeField = (message.embeds || []).some(embed => (
        (embed.fields || []).some(field => /^code\s*\d*$/i.test(field?.name || ''))
    ));

    if (
        games.length !== 1
        || !CODE_PATTERN.test(text)
        || (!REDEEM_PATTERN.test(text) && !hasCodeField)
    ) {
        return null;
    }

    const mentionedRoleIds = getMentionedRoleIds(message);
    return {
        game: games[0],
        type: LIVESTREAM_PATTERN.test(text) ? 'livestream' : 'regular',
        roleId: mentionedRoleIds.length === 1 ? mentionedRoleIds[0] : null,
        createdTimestamp: Number(message.createdTimestamp || 0)
    };
}

function compareChannelEvidence(left, right, countField) {
    return (right[countField] - left[countField])
        || (right.latestMessageAt - left.latestMessageAt)
        || left.channelId.localeCompare(right.channelId);
}

function getUniqueRoleId(evidence, game) {
    const roleIds = new Set(
        evidence
            .filter(item => item.game === game && item.roleId)
            .map(item => item.roleId)
    );
    return roleIds.size === 1 ? [...roleIds][0] : undefined;
}

function buildRecoveredConfig(guildId, channelEvidence = []) {
    const nonThreads = channelEvidence.filter(item => !item.isThread);
    const regularChannels = nonThreads
        .filter(item => item.regularCount > 0)
        .sort((left, right) => compareChannelEvidence(left, right, 'regularCount'));
    const livestreamChannels = nonThreads
        .filter(item => item.livestreamCount > 0)
        .sort((left, right) => compareChannelEvidence(left, right, 'livestreamCount'));
    const mainChannel = regularChannels[0] || livestreamChannels[0];
    const livestreamChannel = livestreamChannels.find(item => (
        item.channelId !== mainChannel?.channelId
    ));
    const config = { guildId };

    if (mainChannel) config.channel = mainChannel.channelId;
    if (mainChannel && livestreamChannel) {
        config.livestreamChannel = livestreamChannel.channelId;
    }

    const forumThreads = {};
    const threadFields = { genshin: 'genshin', hkrpg: 'hsr', nap: 'zzz' };
    for (const [game, field] of Object.entries(threadFields)) {
        const thread = channelEvidence
            .filter(item => item.isThread && item.games?.includes(game))
            .sort((left, right) => (
                compareChannelEvidence(left, right, 'regularCount')
            ))[0];
        if (thread) forumThreads[field] = thread.channelId;
    }
    if (Object.keys(forumThreads).length > 0) config.forumThreads = forumThreads;

    const allEvidence = channelEvidence.flatMap(item => item.evidence || []);
    const roles = {
        genshinRole: getUniqueRoleId(allEvidence, 'genshin'),
        hsrRole: getUniqueRoleId(allEvidence, 'hkrpg'),
        zzzRole: getUniqueRoleId(allEvidence, 'nap')
    };
    for (const [field, roleId] of Object.entries(roles)) {
        if (roleId) config[field] = roleId;
    }

    const hasDeliveryTarget = Boolean(
        config.channel
        || config.livestreamChannel
        || Object.keys(config.forumThreads || {}).length
    );
    return hasDeliveryTarget ? config : null;
}

function channelPriority(channel) {
    const name = String(channel?.name || '');
    return (CHANNEL_NAME_PATTERN.test(name) ? 100 : 0)
        + (channel?.isThread?.() ? 10 : 0);
}

async function scanChannelEvidence(channel, botUserId, historyPages) {
    const evidence = [];
    let before;

    for (let page = 0; page < historyPages; page++) {
        const messages = await channel.messages.fetch({
            limit: 100,
            cache: false,
            ...(before ? { before } : {})
        });
        if (!messages?.size) break;

        for (const message of messages.values()) {
            const match = getCodeNotificationEvidence(message, botUserId);
            if (match) evidence.push(match);
        }

        const oldestMessage = [...messages.values()].reduce((oldest, message) => (
            !oldest || message.createdTimestamp < oldest.createdTimestamp ? message : oldest
        ), null);
        before = oldestMessage?.id;
        if (!before || messages.size < 100) break;
    }

    if (evidence.length === 0) return null;
    return {
        channelId: channel.id,
        channelName: channel.name || null,
        isThread: Boolean(channel.isThread?.()),
        regularCount: evidence.filter(item => item.type === 'regular').length,
        livestreamCount: evidence.filter(item => item.type === 'livestream').length,
        latestMessageAt: Math.max(...evidence.map(item => item.createdTimestamp)),
        games: [...new Set(evidence.map(item => item.game))],
        evidence
    };
}

async function scanOwnedGuildsForConfigRecovery(shardClient, context = {}) {
    const maxChannelsPerGuild = Math.max(1, Number(context.maxChannelsPerGuild) || 15);
    const historyPages = Math.max(1, Math.min(3, Number(context.historyPages) || 2));
    const results = [];

    for (const guildId of context.guildIds || []) {
        const guild = shardClient.guilds.cache.get(guildId);
        if (!guild) continue;

        const botMember = guild.members.me || guild.members.cache.get(shardClient.user.id);
        const channels = [...guild.channels.cache.values()]
            .filter(channel => (
                channel?.isTextBased?.()
                && typeof channel.messages?.fetch === 'function'
            ))
            .filter(channel => {
                const permissions = botMember ? channel.permissionsFor(botMember) : null;
                const sendPermission = channel.isThread?.()
                    ? PermissionFlagsBits.SendMessagesInThreads
                    : PermissionFlagsBits.SendMessages;
                return permissions?.has([
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.EmbedLinks,
                    sendPermission
                ]);
            })
            .sort((left, right) => (
                channelPriority(right) - channelPriority(left)
                || String(left.id).localeCompare(String(right.id))
            ))
            .slice(0, maxChannelsPerGuild);

        const channelEvidence = [];
        for (const channel of channels) {
            try {
                const evidence = await scanChannelEvidence(
                    channel,
                    shardClient.user.id,
                    historyPages
                );
                if (evidence) channelEvidence.push(evidence);
            } catch (error) {
                console.warn(
                    `[Config Recovery] Could not inspect ${guildId}/${channel.id}: ${error.message}`
                );
            }
        }

        results.push({
            guildId,
            guildName: guild.name,
            scannedChannelCount: channels.length,
            config: buildRecoveredConfig(guildId, channelEvidence)
        });
    }

    return results;
}

function scanRecoveryOnShard(shardClient, context) {
    return require(`${process.cwd()}/utils/configRecovery.js`).scanOwnedGuildsForConfigRecovery(
        shardClient,
        context
    );
}

async function recoverMissingGuildConfigurations(
    client,
    guildIds,
    {
        ConfigModel = Config,
        SettingsModel = Settings,
        maxChannelsPerGuild = 15,
        historyPages = 2
    } = {}
) {
    const uniqueGuildIds = [...new Set((guildIds || []).filter(Boolean))];
    if (!client || uniqueGuildIds.length === 0) {
        return { recovered: 0, unresolved: [] };
    }

    console.log(
        `[Config Recovery] Inspecting Discord history for ${uniqueGuildIds.length} `
        + 'connected guild(s) missing Config...'
    );
    const context = {
        guildIds: uniqueGuildIds,
        maxChannelsPerGuild,
        historyPages
    };
    const shardResults = client.shard?.broadcastEval
        ? await broadcastEvalWhenReady(client, scanRecoveryOnShard, { context })
        : [await scanOwnedGuildsForConfigRecovery(client, context)];
    const results = shardResults.flat();
    const unresolved = [];
    let recovered = 0;

    for (const result of results) {
        if (!result.config) {
            unresolved.push(result.guildId);
            console.warn(
                `[Config Recovery] No reliable bot message history found for `
                + `${result.guildName || result.guildId} (${result.guildId}); /setup is required`
            );
            continue;
        }

        const configWrite = await ConfigModel.updateOne(
            { guildId: result.guildId },
            { $setOnInsert: result.config },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
        );
        if (configWrite.upsertedCount !== 1) {
            continue;
        }

        await SettingsModel.updateOne(
            { guildId: result.guildId },
            { $setOnInsert: { guildId: result.guildId } },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
        );
        recovered++;
        console.log(
            `[Config Recovery] Restored ${result.guildName || result.guildId} `
            + `(${result.guildId}) from ${result.scannedChannelCount} inspected channel(s): `
            + JSON.stringify(result.config)
        );
    }

    console.log(
        `[Config Recovery] Complete: ${recovered} restored, ${unresolved.length} unresolved`
    );
    return { recovered, unresolved };
}

module.exports = {
    getCodeNotificationEvidence,
    buildRecoveredConfig,
    scanOwnedGuildsForConfigRecovery,
    recoverMissingGuildConfigurations
};
