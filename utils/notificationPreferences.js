'use strict';

function shouldSendGameNotifications(settings, game) {
    if (settings?.autoSendEnabled === false) {
        return false;
    }

    if (
        settings?.favoriteGames?.enabled
        && settings.favoriteGames.games?.[game] === false
    ) {
        return false;
    }

    return true;
}

module.exports = {
    shouldSendGameNotifications
};
