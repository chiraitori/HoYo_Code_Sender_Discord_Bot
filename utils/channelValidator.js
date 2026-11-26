const Settings = require('../models/Settings');
const Config = require('../models/Config');

/**
 * Validates if a channel is accessible to the bot
 * @param {Object} client - Discord client object
 * @param {String} guildId - Guild ID
 * @param {Object} [options] - Optional overrides
 * @param {String} [options.channelId] - Validate this specific channel instead of reading Config
 * @param {Boolean} [options.persistStatus=true] - Whether to write channelStatus to Settings
 * @returns {Promise<{isValid: boolean, channel: Object|null, error: String|null}>}
 */
async function validateChannel(client, guildId, options = {}) {
    const persistStatus = options.persistStatus !== false;

    try {
        // Get guild object
        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
            // Guild not accessible (bot kicked or guild deleted)
            if (persistStatus) {
                await updateChannelStatus(guildId, false, 'Guild not accessible');
            }
            return { isValid: false, channel: null, error: 'Guild not accessible' };
        }

        // Determine target channel ID
        let targetChannelId = options.channelId || null;
        if (!targetChannelId) {
            const config = await Config.findOne({ guildId }).sort({ _id: -1 });
            targetChannelId = config?.channel || null;
        }
        if (!targetChannelId) {
            if (persistStatus) {
                await updateChannelStatus(guildId, false, 'No channel configured');
            }
            return { isValid: false, channel: null, error: 'No channel configured' };
        }

        // Try to fetch the channel
        const channel = await guild.channels.fetch(targetChannelId).catch(() => null);
        if (!channel) {
            if (persistStatus) {
                await updateChannelStatus(guildId, false, 'Channel not found');
            }
            return { isValid: false, channel: null, error: 'Channel not found' };
        }

        // Resolve bot member safely (may not be cached under tight GuildMemberManager limits)
        let botMember = guild.members?.me || null;
        if (!botMember && typeof guild.members?.fetchMe === 'function') {
            botMember = await guild.members.fetchMe().catch(() => null);
        }
        if (!botMember && client.user?.id && typeof guild.members?.fetch === 'function') {
            botMember = await guild.members.fetch(client.user.id).catch(() => null);
        }

        // Check bot permissions in channel
        const sendPermission = channel.isThread?.() ? 'SendMessagesInThreads' : 'SendMessages';
        const permissions = botMember && typeof channel.permissionsFor === 'function'
            ? channel.permissionsFor(botMember)
            : null;
        if (!permissions || !permissions.has(['ViewChannel', sendPermission, 'EmbedLinks'])) {
            if (persistStatus) {
                await updateChannelStatus(guildId, false, 'Missing permissions in channel');
            }
            return { isValid: false, channel: null, error: 'Missing permissions in channel' };
        }

        // Check if channel is a text channel
        if (!channel.send || typeof channel.send !== 'function') {
            if (persistStatus) {
                await updateChannelStatus(guildId, false, 'Channel is not a text channel');
            }
            return { isValid: false, channel: null, error: 'Channel is not a text channel' };
        }

        // Channel is valid
        if (persistStatus) {
            await updateChannelStatus(guildId, true);
        }
        return { isValid: true, channel, error: null };
    } catch (error) {
        console.error(`Channel validation error for guild ${guildId}:`, error);
        if (persistStatus) {
            await updateChannelStatus(guildId, false, `Unexpected error: ${error.message}`);
        }
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
            { upsert: true, sort: { _id: -1 } }
        );
    } catch (dbError) {
        console.error(`Failed to update channel status for guild ${guildId}:`, dbError);
    }
}

module.exports = { validateChannel };
