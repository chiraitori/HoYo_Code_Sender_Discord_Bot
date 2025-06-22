const fs = require('fs');
const path = require('path');
const Language = require('../models/Language');
const { translateReward } = require('./dictionary');

class LanguageManager {
    constructor() {
        this.languages = {};
        this.languageCache = new Map(); // Cache for guild language preferences
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
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

    async getGuildLanguage(guildId) {
        // Check cache first
        const cached = this.languageCache.get(guildId);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.language;
        }

        try {
            // Get from database
            const guildLang = await Language.findOne({ guildId });
            const language = guildLang?.language || 'en';
            
            // Cache the result
            this.languageCache.set(guildId, {
                language: language,
                timestamp: Date.now()
            });
            
            return language;
        } catch (error) {
            console.error('Language lookup error:', error);
            return 'en'; // Fallback to English
        }
    }

    async getString(key, guildId, replacements = {}) {
        try {
            // Get guild's language preference (with caching)
            const selectedLang = await this.getGuildLanguage(guildId);
            
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
    }    async getRewardString(reward, guildId) {
        try {
            const selectedLang = await this.getGuildLanguage(guildId);
            
            const translatedReward = translateReward(reward, selectedLang);
            const rewardTemplate = await this.getString('commands.listcodes.reward', guildId);
            
            return rewardTemplate.replace('{reward}', translatedReward);
        } catch (error) {
            console.error('Error translating reward:', error);
            return reward;
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

    // Method to clear cache for a specific guild (useful when language is changed)
    clearGuildCache(guildId) {
        this.languageCache.delete(guildId);
    }

    // Method to clear all cache
    clearCache() {
        this.languageCache.clear();
    }
}

module.exports = new LanguageManager();