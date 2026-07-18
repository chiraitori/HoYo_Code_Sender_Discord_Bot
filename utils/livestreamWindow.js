'use strict';

const DEFAULT_DISTRIBUTION_WINDOW_SECONDS = 24 * 60 * 60;

function getDistributionWindowSeconds() {
    const configuredHours = Number.parseFloat(
        process.env.LIVESTREAM_DISTRIBUTION_WINDOW_HOURS || '24'
    );
    const safeHours = Number.isFinite(configuredHours) && configuredHours > 0
        ? configuredHours
        : 24;
    return safeHours * 60 * 60;
}

function isTrackingPastDistributionWindow(
    tracking,
    nowSeconds = Math.floor(Date.now() / 1000),
    windowSeconds = getDistributionWindowSeconds()
) {
    const streamTime = Number(tracking?.streamTime || 0);
    return streamTime > 0 && streamTime < nowSeconds - windowSeconds;
}

function isLivestreamCodeExpired(codeData, nowSeconds = Math.floor(Date.now() / 1000)) {
    const expireAt = Number(codeData?.expireAt || 0);
    return expireAt > 0 && expireAt <= nowSeconds;
}

function getActiveLivestreamCodes(codes, nowSeconds = Math.floor(Date.now() / 1000)) {
    return (codes || []).filter(codeData => (
        codeData?.code && !isLivestreamCodeExpired(codeData, nowSeconds)
    ));
}

module.exports = {
    DEFAULT_DISTRIBUTION_WINDOW_SECONDS,
    getDistributionWindowSeconds,
    isTrackingPastDistributionWindow,
    isLivestreamCodeExpired,
    getActiveLivestreamCodes
};
