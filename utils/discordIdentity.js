'use strict';

function getDiscordIdentityError(clientUser, configuredClientId) {
    const loggedInId = clientUser?.id;
    const expectedId = configuredClientId?.trim();

    if (!loggedInId || !expectedId) {
        return 'Unable to validate DISCORD_TOKEN against CLIENT_ID';
    }

    if (loggedInId !== expectedId) {
        return `DISCORD_TOKEN belongs to ${clientUser.tag || loggedInId} (${loggedInId}), `
            + `but CLIENT_ID is ${expectedId}`;
    }

    return null;
}

module.exports = { getDiscordIdentityError };
