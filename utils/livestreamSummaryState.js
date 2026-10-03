const { isTrackingPastDistributionWindow, getActiveLivestreamCodes } = require('./livestreamWindow');

const EXPECTED_LIVE_CODES = { genshin: 3, hkrpg: 3, nap: 1 };

function getSummarySignature(codes) {
    return JSON.stringify((codes || []).map(({ code, title, expireAt }) => ({
        code,
        title: title || '',
        expireAt: Number(expireAt || 0)
    })).sort((a, b) => a.code.localeCompare(b.code)));
}

function isReadyForLivestreamSummary(tracking, now = Math.floor(Date.now() / 1000)) {
    if (!tracking || tracking.disabled || !tracking.streamTime || tracking.streamTime > now
        || isTrackingPastDistributionWindow(tracking, now)) {
        return false;
    }
    const codes = getActiveLivestreamCodes(tracking.codes, now);
    if (codes.length === 0) return false;
    if (codes.length >= EXPECTED_LIVE_CODES[tracking.game]) return true;

    const statuses = [tracking.youtubeStatus, ...(tracking.youtubeStreams || []).map(s => s.status)];
    if (statuses.includes('live') || statuses.includes('upcoming')) return false;
    return statuses.includes('completed') || now - tracking.streamTime >= 2 * 60 * 60;
}

module.exports = { EXPECTED_LIVE_CODES, getSummarySignature, isReadyForLivestreamSummary };
