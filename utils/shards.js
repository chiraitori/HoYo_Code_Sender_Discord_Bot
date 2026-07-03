'use strict';

function normalizeShardIds(rawShardIds) {
    if (rawShardIds === undefined || rawShardIds === null || rawShardIds === '') {
        return [0];
    }

    let parsed = rawShardIds;

    if (typeof rawShardIds === 'string') {
        try {
            parsed = JSON.parse(rawShardIds);
        } catch {
            parsed = rawShardIds.split(',');
        }
    }

    const values = Array.isArray(parsed) ? parsed : [parsed];
    const shardIds = values
        .map(value => Number(value))
        .filter(value => Number.isInteger(value) && value >= 0);

    return shardIds.length > 0 ? shardIds : [0];
}

function getShardIdsFromEnv(env = process.env) {
    return normalizeShardIds(env.SHARDS);
}

function shouldRunPrimaryServices(env = process.env) {
    return getShardIdsFromEnv(env).includes(0);
}

module.exports = {
    normalizeShardIds,
    getShardIdsFromEnv,
    shouldRunPrimaryServices
};
