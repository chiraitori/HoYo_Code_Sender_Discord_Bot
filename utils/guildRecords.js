'use strict';

function getLatestGuildRecords(records = []) {
    const recordsByGuild = new Map();

    for (const record of records) {
        if (!record?.guildId) {
            continue;
        }

        recordsByGuild.set(record.guildId, record);
    }

    return [...recordsByGuild.values()];
}

function countDuplicateGuildRecords(records = []) {
    const guildIds = records
        .map(record => record?.guildId)
        .filter(Boolean);

    return guildIds.length - new Set(guildIds).size;
}

module.exports = {
    getLatestGuildRecords,
    countDuplicateGuildRecords
};
