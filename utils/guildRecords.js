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

async function removeOtherGuildRecords(Model, guildId, keepId) {
    if (!Model || !guildId || !keepId) {
        return 0;
    }

    const result = await Model.deleteMany({
        guildId,
        _id: { $ne: keepId }
    });

    return result.deletedCount || 0;
}

module.exports = {
    getLatestGuildRecords,
    countDuplicateGuildRecords,
    removeOtherGuildRecords
};
