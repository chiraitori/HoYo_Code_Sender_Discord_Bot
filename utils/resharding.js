'use strict';

function calculateReshardTarget({
    totalGuilds,
    currentShards,
    guildsPerShard,
    threshold,
    discordRecommended = 0
}) {
    const safeCurrentShards = Math.max(1, Number(currentShards) || 1);
    const safeGuildsPerShard = Math.max(1, Number(guildsPerShard) || 1);
    const safeThreshold = Number(threshold) > 0 && Number(threshold) <= 1
        ? Number(threshold)
        : 1;
    const safeGuilds = Math.max(0, Number(totalGuilds) || 0);
    const safeDiscordRecommended = Math.max(0, Number(discordRecommended) || 0);

    const thresholdCapacity = safeGuildsPerShard * safeThreshold;
    const thresholdTarget = Math.max(1, Math.ceil(safeGuilds / thresholdCapacity));

    return Math.max(safeCurrentShards, thresholdTarget, safeDiscordRecommended);
}

module.exports = {
    calculateReshardTarget
};
