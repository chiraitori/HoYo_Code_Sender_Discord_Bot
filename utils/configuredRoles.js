'use strict';

const Config = require('../models/Config');
const Settings = require('../models/Settings');
const { broadcastEvalWhenReady } = require('./clusterGuilds');
const { shouldSendGameNotifications } = require('./notificationPreferences');
const { getLatestGuildRecords } = require('./guildRecords');

const ROLE_FIELDS = {
    genshin: 'genshinRole',
    hkrpg: 'hsrRole',
    nap: 'zzzRole'
};

const ROLE_BASE_NAMES = {
    genshin: ['genshin', 'genshinimpact'],
    hkrpg: ['hsr', 'honkaistarrail', 'starrail'],
    nap: ['zzz', 'zenlesszonezero']
};

const ROLE_NAME_SUFFIXES = [
    '',
    'role',
    'code',
    'codes',
    'update',
    'updates',
    'notification',
    'notifications',
    'ping',
    'pings'
];

function normalizeRoleName(name) {
    return String(name || '')
        .normalize('NFKD')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

function getAcceptedRoleNames(game) {
    return new Set(
        (ROLE_BASE_NAMES[game] || []).flatMap(base => (
            ROLE_NAME_SUFFIXES.map(suffix => `${base}${suffix}`)
        ))
    );
}

function findMatchingGameRole(roles, game) {
    const acceptedNames = getAcceptedRoleNames(game);
    const matches = [...(roles || [])].filter(role => (
        role
        && role.id
        && role.name !== '@everyone'
        && !role.managed
        && acceptedNames.has(normalizeRoleName(role.name))
    ));

    return matches.length === 1 ? matches[0] : null;
}

function getDeliveryChannelIds(config, game) {
    const threadFields = {
        genshin: 'genshin',
        hkrpg: 'hsr',
        nap: 'zzz'
    };

    return [
        config.livestreamChannel || config.channel,
        config.forumThreads?.[threadFields[game]]
    ].filter(Boolean);
}

function inspectGuildRoles(shardClient, context) {
    const acceptedNames = new Set(context.acceptedNames);
    const results = [];

    for (const request of context.requests) {
        const guild = shardClient.guilds.cache.get(request.guildId);
        if (!guild) {
            continue;
        }

        let role = request.roleId
            ? guild.roles.cache.get(request.roleId)
            : null;
        let recovered = false;

        if (!role) {
            const matches = guild.roles.cache.filter(candidate => {
                const normalizedName = String(candidate.name || '')
                    .normalize('NFKD')
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '');
                return candidate.name !== '@everyone'
                    && !candidate.managed
                    && acceptedNames.has(normalizedName);
            });

            if (matches.size === 1) {
                role = matches.first();
                recovered = true;
            }
        }

        if (!role) {
            results.push({ guildId: request.guildId, roleId: null });
            continue;
        }

        const botMember = guild.members.me;
        const channelPermissions = request.channelIds
            .map(channelId => guild.channels.cache.get(channelId))
            .filter(Boolean)
            .map(channel => botMember ? channel.permissionsFor(botMember) : null);
        const canUseRoleMentions = role.mentionable
            || (channelPermissions.length > 0
                ? channelPermissions.every(permissions => permissions?.has('MentionEveryone'))
                : botMember?.permissions?.has('MentionEveryone'));

        results.push({
            guildId: request.guildId,
            roleId: role.id,
            recovered,
            canUseRoleMentions: Boolean(canUseRoleMentions)
        });
    }

    return results;
}

async function reconcileConfiguredRoles(client, configs, game) {
    const roleField = ROLE_FIELDS[game];
    if (!roleField || !client || !Array.isArray(configs) || configs.length === 0) {
        return { recovered: 0, missing: 0, cannotMention: 0 };
    }

    const configsByGuild = new Map(configs.map(config => [config.guildId, config]));
    const requests = configs
        .filter(config => config?.guildId)
        .map(config => ({
            guildId: config.guildId,
            roleId: config[roleField] || null,
            channelIds: getDeliveryChannelIds(config, game)
        }));
    const context = {
        requests,
        acceptedNames: [...getAcceptedRoleNames(game)]
    };

    const shardResults = client.shard?.broadcastEval
        ? await broadcastEvalWhenReady(client, inspectGuildRoles, { context })
        : [inspectGuildRoles(client, context)];
    const results = shardResults.flat();
    const repairs = [];

    for (const result of results) {
        if (!result.recovered || !result.roleId) {
            continue;
        }

        const config = configsByGuild.get(result.guildId);
        if (!config || config[roleField] === result.roleId) {
            continue;
        }

        const previousRoleId = config[roleField] || null;
        config[roleField] = result.roleId;
        repairs.push({
            updateOne: {
                filter: {
                    guildId: result.guildId,
                    [roleField]: previousRoleId
                },
                update: { $set: { [roleField]: result.roleId } }
            }
        });
    }

    if (repairs.length > 0) {
        await Config.bulkWrite(repairs, { ordered: false });
        console.log(`[Role Config] Recovered ${repairs.length} ${game} role(s) by exact role name`);
    }

    const missingGuilds = results.filter(result => !result.roleId);
    const blockedGuilds = results.filter(result => (
        result.roleId && !result.canUseRoleMentions
    ));
    if (missingGuilds.length > 0) {
        console.warn(
            `[Role Config] ${missingGuilds.length} ${game} guild(s) have no configured or `
            + 'uniquely named notification role; messages will be sent without a role ping. '
            + `Guilds: ${missingGuilds.map(result => result.guildId).join(', ')}`
        );
    }
    if (blockedGuilds.length > 0) {
        console.warn(
            `[Role Config] ${blockedGuilds.length} ${game} role(s) are not mentionable and `
            + 'the bot lacks MentionEveryone in one or more delivery channels. '
            + `Guilds: ${blockedGuilds.map(result => result.guildId).join(', ')}`
        );
    }

    return {
        recovered: repairs.length,
        missing: missingGuilds.length,
        cannotMention: blockedGuilds.length
    };
}

async function reconcileAllConfiguredRoles(client) {
    const [rawConfigs, rawSettings] = await Promise.all([
        Config.find({}).sort({ _id: 1 }).lean(),
        Settings.find({}).sort({ _id: 1 }).lean()
    ]);
    const configs = getLatestGuildRecords(rawConfigs);
    const settings = getLatestGuildRecords(rawSettings);
    const settingsMap = new Map(settings.map(row => [row.guildId, row]));
    const threadFields = {
        genshin: 'genshin',
        hkrpg: 'hsr',
        nap: 'zzz'
    };
    const summaries = {};

    for (const game of Object.keys(ROLE_FIELDS)) {
        const eligibleConfigs = configs.filter(config => {
            const guildSettings = settingsMap.get(config.guildId);
            const hasChannelTarget = guildSettings?.autoSendOptions?.channel !== false
                && Boolean(config.livestreamChannel || config.channel);
            const hasThreadTarget = guildSettings?.autoSendOptions?.threads !== false
                && Boolean(config.forumThreads?.[threadFields[game]]);
            return shouldSendGameNotifications(guildSettings, game)
                && (hasChannelTarget || hasThreadTarget);
        });

        summaries[game] = await reconcileConfiguredRoles(
            client,
            eligibleConfigs,
            game
        );
    }

    return summaries;
}

module.exports = {
    ROLE_FIELDS,
    normalizeRoleName,
    findMatchingGameRole,
    reconcileConfiguredRoles,
    reconcileAllConfiguredRoles
};
