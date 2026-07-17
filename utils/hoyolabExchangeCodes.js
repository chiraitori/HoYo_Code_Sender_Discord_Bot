'use strict';

const { fetchLivestreamCodes } = require('./hoyolabAPI');
const { parseIconBonuses } = require('./rewardIconParser');

const CACHE_DURATION = 3 * 60 * 1000;
const codeCache = new Map();

function normalizeCode(game, codeData) {
    const code = String(codeData?.code || '').trim().toUpperCase();
    if (!code) {
        return null;
    }

    return {
        ...codeData,
        code,
        game: codeData.game || game,
        status: codeData.status || 'OK',
        rewards: typeof codeData.rewards === 'string' ? codeData.rewards : ''
    };
}

function extractHoyolabExchangeCodes(game, responseData) {
    const modules = responseData?.data?.modules || [];
    const codes = [];
    const seenCodes = new Set();

    for (const module of modules) {
        const bonuses = module.exchange_group?.bonuses || [];

        for (const bonus of bonuses) {
            const code = String(bonus.exchange_code || '').trim().toUpperCase();
            if (!code || seenCodes.has(code)) {
                continue;
            }

            seenCodes.add(code);
            const rewards = parseIconBonuses(bonus.icon_bonuses, game, 'en');
            const isActive = !bonus.code_status || bonus.code_status === 'ON';

            codes.push({
                id: Number(module.in_feed_position) || 0,
                code,
                game,
                status: isActive ? 'OK' : 'EXPIRED',
                rewards: rewards === 'Unknown Rewards' ? '' : rewards,
                source: 'hoyolab',
                offlineAt: bonus.offline_at || module.exchange_group?.offline_at || 0
            });
        }
    }

    return codes;
}

async function getHoyolabExchangeCodes(game) {
    const cached = codeCache.get(game);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.codes;
    }

    const responseData = await fetchLivestreamCodes(game);
    const codes = extractHoyolabExchangeCodes(game, responseData);

    codeCache.set(game, {
        codes,
        timestamp: Date.now()
    });

    return codes;
}

function mergeExchangeCodes(game, primaryCodes = [], hoyolabCodes = []) {
    const mergedByCode = new Map();

    for (const codeData of primaryCodes) {
        const normalized = normalizeCode(game, codeData);
        if (normalized) {
            mergedByCode.set(normalized.code, normalized);
        }
    }

    for (const hoyolabCode of hoyolabCodes) {
        const normalized = normalizeCode(game, hoyolabCode);
        if (!normalized) {
            continue;
        }

        const existing = mergedByCode.get(normalized.code);
        if (!existing) {
            mergedByCode.set(normalized.code, normalized);
            continue;
        }

        if (!existing.rewards && normalized.rewards) {
            mergedByCode.set(normalized.code, {
                ...existing,
                rewards: normalized.rewards,
                offlineAt: normalized.offlineAt
            });
        }
    }

    return Array.from(mergedByCode.values());
}

module.exports = {
    extractHoyolabExchangeCodes,
    getHoyolabExchangeCodes,
    mergeExchangeCodes
};
