const { getHoyolabExchangeCodes } = require('./hoyolabExchangeCodes');

function hasRewardText(rewards) {
    return typeof rewards === 'string' && rewards.trim().length > 0;
}

async function getHoyolabRewards(game) {
    try {
        const codes = await getHoyolabExchangeCodes(game);
        const rewards = new Map();

        for (const code of codes) {
            if (hasRewardText(code.rewards)) {
                rewards.set(code.code, code.rewards);
            }
        }

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
