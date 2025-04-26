const Settings = require('../models/Settings');
const Config = require('../models/Config');

/**
 * Validates if a channel is accessible to the bot
 * @param {Object} client - Discord client object
 * @param {String} guildId - Guild ID
 * @returns {Promise<{isValid: boolean, channel: Object|null, error: String|null}>}
 */
async function validateChannel(client, guildId) {
    try {
        // Get guild object
        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
            // Guild not accessible (bot kicked or guild deleted)
            await updateChannelStatus(guildId, false, 'Guild not accessible');
            return { isValid: false, channel: null, error: 'Guild not accessible' };
        }

        // Get config with channel ID
        const config = await Config.findOne({ guildId });
        if (!config || !config.channel) {
            await updateChannelStatus(guildId, false, 'No channel configured');
            return { isValid: false, channel: null, error: 'No channel configured' };
        }

        // Try to fetch the channel
        const channel = await guild.channels.fetch(config.channel).catch(() => null);
        if (!channel) {
            await updateChannelStatus(guildId, false, 'Channel not found');
            return { isValid: false, channel: null, error: 'Channel not found' };
        }

        // Check bot permissions in channel
        if (!channel.permissionsFor || !channel.permissionsFor(guild.members.me).has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
            await updateChannelStatus(guildId, false, 'Missing permissions in channel');
            return { isValid: false, channel: null, error: 'Missing permissions in channel' };
        }

        // Check if channel is a text channel
        if (!channel.send || typeof channel.send !== 'function') {
            await updateChannelStatus(guildId, false, 'Channel is not a text channel');
            return { isValid: false, channel: null, error: 'Channel is not a text channel' };
        }

        // Channel is valid
        await updateChannelStatus(guildId, true);
        return { isValid: true, channel, error: null };
    } catch (error) {
        console.error(`Channel validation error for guild ${guildId}:`, error);
        await updateChannelStatus(guildId, false, `Unexpected error: ${error.message}`);
        return { isValid: false, channel: null, error: `Unexpected error: ${error.message}` };
    }
}

/**
 * Updates the channel status in the database
 * @param {String} guildId - Guild ID
 * @param {Boolean} isValid - Whether the channel is valid
 * @param {String|null} error - Error message if any
 */
async function updateChannelStatus(guildId, isValid, error = null) {
    try {
        await Settings.findOneAndUpdate(
            { guildId },
            {
                'channelStatus.isInvalid': !isValid,
                'channelStatus.lastError': error,
                'channelStatus.lastChecked': new Date()
            },
            { upsert: true }
        );
    } catch (dbError) {
        console.error(`Failed to update channel status for guild ${guildId}:`, dbError);
    }
}

module.exports = { validateChannel };
