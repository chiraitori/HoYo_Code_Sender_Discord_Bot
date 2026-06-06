const { fetchLivestreamCodes } = require('./hoyolabAPI');
const { parseIconBonuses } = require('./rewardIconParser');

const rewardCache = new Map();
const CACHE_DURATION = 3 * 60 * 1000;

function hasRewardText(rewards) {
    return typeof rewards === 'string' && rewards.trim().length > 0;
}

async function getHoyolabRewards(game) {
    const cached = rewardCache.get(game);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.rewards;
    }

    try {
        const response = await fetchLivestreamCodes(game);
        const modules = response?.data?.modules || [];
        const rewards = new Map();

        for (const module of modules) {
            const bonuses = module.exchange_group?.bonuses || [];

            for (const bonus of bonuses) {
                if (!bonus.exchange_code || !bonus.icon_bonuses?.length) {
                    continue;
                }

                rewards.set(
                    bonus.exchange_code.trim().toUpperCase(),
                    parseIconBonuses(bonus.icon_bonuses, game, 'en')
                );
            }
        }

        rewardCache.set(game, {
            rewards,
            timestamp: Date.now()
        });

        return rewards;
    } catch (error) {
        console.error(`[Reward Enricher] Could not fetch HoYoLAB rewards for ${game}:`, error.message);
        return new Map();
    }
}

async function enrichCodesWithHoyolabRewards(game, codes) {
    if (!Array.isArray(codes) || !codes.some(code => !hasRewardText(code.rewards))) {
        return codes;
    }

    const hoyolabRewards = await getHoyolabRewards(game);

    return codes.map(code => {
        if (hasRewardText(code.rewards)) {
            return code;
        }

        const rewards = hoyolabRewards.get(String(code.code || '').trim().toUpperCase());
        return rewards ? { ...code, rewards } : code;
    });
}

module.exports = {
    enrichCodesWithHoyolabRewards,
    hasRewardText
};
