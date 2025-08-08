const Config = require('../models/Config');
const Settings = require('../models/Settings');
const Language = require('../models/Language');

/**
 * Optimized guild data fetcher that combines multiple database queries
 * @param {string} guildId - Guild ID
 * @param {Object} options - What data to fetch
 * @returns {Object} Combined guild data
 */
async function getGuildData(guildId, options = {}) {
    const {
        includeConfig = true,
        includeSettings = true,
        includeLanguage = true
    } = options;

    const queries = [];
    
    if (includeConfig) {
        queries.push(Config.findOne({ guildId }));
    }
    
    if (includeSettings) {
        queries.push(Settings.findOne({ guildId }));
    }
    
    if (includeLanguage) {
        queries.push(Language.findOne({ guildId }));
    }

    try {
        const results = await Promise.all(queries);
        let index = 0;
        
        return {
            config: includeConfig ? results[index++] : null,
            settings: includeSettings ? results[index++] : null,
            language: includeLanguage ? results[index++] : null
        };
    } catch (error) {
        console.error('Error fetching guild data:', error);
        return {
            config: null,
            settings: null,
            language: null
        };
    }
}

/**
 * Bulk update guild data with single transaction
 * @param {string} guildId - Guild ID
 * @param {Object} updates - Data to update
 */
async function updateGuildData(guildId, updates = {}) {
    const { config, settings, language } = updates;
    const updatePromises = [];

    if (config) {
        updatePromises.push(
            Config.findOneAndUpdate(
                { guildId },
                config,
                { upsert: true, new: true }
            )
        );
    }

    if (settings) {
        updatePromises.push(
            Settings.findOneAndUpdate(
                { guildId },
                settings,
                { upsert: true, new: true }
            )
        );
    }

    if (language) {
        updatePromises.push(
            Language.findOneAndUpdate(
                { guildId },
                language,
                { upsert: true, new: true }
            )
        );
    }

    try {
        await Promise.all(updatePromises);
        return true;
    } catch (error) {
        console.error('Error updating guild data:', error);
        return false;
    }
}

module.exports = {
    getGuildData,
    updateGuildData
};
