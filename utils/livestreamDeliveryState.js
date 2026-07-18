function getCodeValue(codeData) {
    return typeof codeData === 'string' ? codeData : codeData?.code;
}

function getCodeDeliveryId(targetId, codeData) {
    const code = getCodeValue(codeData);
    return code ? `${targetId}:code:${code}` : null;
}

function getLegacyCodeDeliveryIds(targetIds, codes) {
    return (targetIds || []).flatMap(targetId => (
        (codes || [])
            .map(codeData => getCodeDeliveryId(targetId, codeData))
            .filter(Boolean)
    ));
}

function getSharedCodeDeliveryIds(targets, codeRows) {
    return (targets || []).flatMap(target => (
        (codeRows || []).flatMap(codeRow => (
            (codeRow.notifiedTargets || []).includes(target.id)
                ? [getCodeDeliveryId(target.id, codeRow)]
                : []
        ))
    ));
}

function getPendingCodeDeliveries(targets, codes, deliveredCodeTargetIds) {
    const delivered = new Set(deliveredCodeTargetIds || []);

    return (targets || []).map(target => ({
        target,
        codes: (codes || []).filter(codeData => {
            const deliveryId = getCodeDeliveryId(target.id, codeData);
            return deliveryId && !delivered.has(deliveryId);
        })
    })).filter(delivery => delivery.codes.length > 0);
}

function getCodeDeliveryProgress(targets, codes, deliveredCodeTargetIds, pendingDeliveries, results) {
    const delivered = new Set(deliveredCodeTargetIds || []);
    const successfulCodeTargetIds = results.flatMap((result, index) => {
        if (result.status !== 'fulfilled' || result.value !== true) {
            return [];
        }

        return pendingDeliveries[index].codes
            .map(codeData => getCodeDeliveryId(pendingDeliveries[index].target.id, codeData))
            .filter(Boolean);
    });
    successfulCodeTargetIds.forEach(deliveryId => delivered.add(deliveryId));

    const expectedDeliveryIds = (targets || []).flatMap(target => (
        (codes || [])
            .map(codeData => getCodeDeliveryId(target.id, codeData))
            .filter(Boolean)
    ));

    return {
        successfulCodeTargetIds,
        deliveredCodeTargetIds: delivered,
        failCount: results.length - results.filter(
            result => result.status === 'fulfilled' && result.value === true
        ).length,
        distributed: expectedDeliveryIds.every(deliveryId => delivered.has(deliveryId))
    };
}

module.exports = {
    getCodeDeliveryId,
    getLegacyCodeDeliveryIds,
    getSharedCodeDeliveryIds,
    getPendingCodeDeliveries,
    getCodeDeliveryProgress
};
