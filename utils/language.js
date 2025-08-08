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
        // If no guildId (DMs), return default language
        if (!guildId) {
            return 'en';
        }

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
            // For DMs (guildId = null), this will return 'en'
            const selectedLang = await this.getGuildLanguage(guildId);
            
            // Get the string from the language file
            const lang = this.languages[selectedLang];
            if (!lang) return this.getStringFromPath(key, this.languages.en, replacements);

            let text = this.getStringFromPath(key, lang, replacements);
            
            // Fallback to English if string not found
            if (!text && selectedLang !== 'en') {
                text = this.getStringFromPath(key, this.languages.en, replacements);
            }

            // If still no text found, return a meaningful fallback instead of the key
            if (!text) {
                console.warn(`Translation key not found: ${key}`);
                return this.getFallbackText(key);
            }

            return text;
        } catch (error) {
            console.error('Language error:', error);
            return this.getFallbackText(key);
        }
    }    async getRewardString(reward, guildId) {
        try {
            // Get guild language (will return 'en' for DMs)
            const selectedLang = await this.getGuildLanguage(guildId);
            
            const translatedReward = translateReward(reward, selectedLang);
            const rewardTemplate = await this.getString('commands.listcodes.reward', guildId);
            
            // If template is missing, use a simple fallback
            if (rewardTemplate.startsWith('Translation missing:')) {
                return `Reward: ${translatedReward}`;
            }
            
            return rewardTemplate.replace('{reward}', translatedReward);
        } catch (error) {
            console.error('Error translating reward:', error);
            return `Reward: ${reward}`;
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

    getFallbackText(key) {
        // Provide meaningful fallbacks for common translation keys
        const fallbacks = {
            'commands.help.error': 'An error occurred while loading help information.',
            'commands.help.title': 'HoYo Code Sender Help',
            'commands.help.description': 'HoYo Code Sender automatically notifies your server about new redemption codes.',
            'commands.vote.title': 'Vote for HoYo Code Sender',
            'commands.vote.description': 'Support the bot by voting on Top.gg!',
            'commands.vote.status': 'Vote Status',
            'commands.vote.hasVoted': 'You have voted recently!',
            'commands.vote.hasNotVoted': 'You haven\'t voted yet.',
            'commands.vote.link': 'Vote on Top.gg',
            'commands.vote.error': 'Error checking vote status.',
            'commands.vote.thankTitle': 'Thank You for Your Vote! 🎉',
            'commands.vote.thankMessage': 'Thank you for supporting the bot! Your vote helps us grow.',
            'commands.vote.dmThankTitle': 'Thank You for Your Vote!',
            'commands.vote.dmThankMessage': 'Thank you for voting for HoYo Code Sender on Top.gg! Your support means a lot to us.',
            'commands.vote.voteAgain': 'You can vote again in 12 hours.',
            'commands.about.title': 'About HoYo Code Sender',
            'commands.listcodes.loading': 'Loading codes...',
            'commands.listcodes.error': 'Error loading codes.',
            'commands.listcodes.newCodes': 'New {game} Codes!',
            'commands.listcodes.redeemButton': 'Redeem',
            'commands.listcodes.noReward': 'No reward information',
            'errors.general': 'An error occurred. Please try again.',
            'errors.dmNotAllowed': 'This command can only be used in Discord servers, not in direct messages.',
            'common.enabled': 'ENABLED',
            'common.disabled': 'DISABLED',
            'common.notYourButton': 'This button is not for you.'
        };

        return fallbacks[key] || `Translation missing: ${key}`;
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