const fs = require('fs');
const path = require('path');
const Language = require('../models/Language');

class LanguageManager {
    constructor() {
        this.languages = {};
        this.loadLanguages();
    }

    loadLanguages() {
        const langPath = path.join(__dirname, '../lang');
        const langFiles = fs.readdirSync(langPath).filter(file => file.endsWith('.js'));

        for (const file of langFiles) {
            const langCode = file.split('.')[0];
            this.languages[langCode] = require(path.join(langPath, file));
        }
    }

    async getString(key, guildId, replacements = {}) {
        try {
            // Get guild's language preference
            const guildLang = await Language.findOne({ guildId });
            const selectedLang = guildLang?.language || 'en';
            
            // Get the string from the language file
            const lang = this.languages[selectedLang];
            if (!lang) return this.getStringFromPath(key, this.languages.en, replacements);

            let text = this.getStringFromPath(key, lang, replacements);
            
            // Fallback to English if string not found
            if (!text && selectedLang !== 'en') {
                text = this.getStringFromPath(key, this.languages.en, replacements);
            }

            return text || key;
        } catch (error) {
            console.error('Language error:', error);
            return key;
        }
    }

    getStringFromPath(key, langObj, replacements) {
        let text = key.split('.').reduce((obj, i) => obj?.[i], langObj);
        if (!text) return null;

        // Replace placeholders
        Object.entries(replacements).forEach(([key, value]) => {
            text = text.replace(new RegExp(`{${key}}`, 'g'), value);
        });

        return text;
    }

    getAvailableLanguages() {
        return Object.keys(this.languages);
    }
}

module.exports = new LanguageManager();