'use strict';

const Config = require('../models/Config');
const Settings = require('../models/Settings');
const { getKnownGuildIds } = require('./clusterGuilds');

function getGuildConfigurationGaps(knownGuildIds, configs = [], settings = []) {
    const connected = new Set(knownGuildIds || []);
    const configured = new Set(configs.map(row => row?.guildId).filter(Boolean));
    const settingsGuilds = new Set(settings.map(row => row?.guildId).filter(Boolean));

    return {
        connectedGuildCount: connected.size,
        configuredGuildCount: configured.size,
        missingConfigGuildIds: [...connected].filter(guildId => !configured.has(guildId)),
        missingSettingsGuildIds: [...connected].filter(
            guildId => configured.has(guildId) && !settingsGuilds.has(guildId)
        ),
        disconnectedConfigGuildIds: [...configured].filter(guildId => !connected.has(guildId))
    };
}

async function auditGuildConfigurations(client) {
    const [knownGuildIds, configs, settings] = await Promise.all([
        getKnownGuildIds(client),
        Config.find({}, { guildId: 1 }).lean(),
        Settings.find({}, { guildId: 1 }).lean()
    ]);
    const audit = getGuildConfigurationGaps(knownGuildIds, configs, settings);

    console.log(
        `[Config Audit] ${audit.connectedGuildCount} connected guilds, `
        + `${audit.configuredGuildCount} configured, `
        + `${audit.missingConfigGuildIds.length} connected guilds missing Config, `
        + `${audit.missingSettingsGuildIds.length} configured guilds missing Settings, `
        + `${audit.disconnectedConfigGuildIds.length} disconnected Config rows retained`
    );

    if (audit.missingConfigGuildIds.length > 0) {
        console.error(
            '[Config Audit] Connected guilds missing Config; run /setup in these guilds: '
            + audit.missingConfigGuildIds.join(', ')
        );
    }
    if (audit.missingSettingsGuildIds.length > 0) {
        console.warn(
            '[Config Audit] Guilds missing Settings use safe default-on preferences: '
            + audit.missingSettingsGuildIds.join(', ')
        );
    }

    return audit;
}

module.exports = {
    getGuildConfigurationGaps,
    auditGuildConfigurations
};
