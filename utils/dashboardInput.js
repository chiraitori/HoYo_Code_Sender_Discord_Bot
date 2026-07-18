'use strict';

function getValidatedLanguage(rawLanguage) {
    switch (rawLanguage) {
        case 'en':
            return 'en';
        case 'jp':
            return 'jp';
        case 'vi':
            return 'vi';
        default:
            return null;
    }
}

module.exports = {
    getValidatedLanguage
};
