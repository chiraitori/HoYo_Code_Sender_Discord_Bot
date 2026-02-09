const { EmbedBuilder } = require('discord.js');
const Config = require('../models/Config');
const Settings = require('../models/Settings');

/**
 * Announcement system for Special Program detection
 * Sends announcement when livestream is detected (no role ping)
 */

const GAME_NAMES = {
    'genshin': 'Genshin Impact',
    'hkrpg': 'Honkai: Star Rail',
    'nap': 'Zenless Zone Zero'
};

/**
 * Send announcement to all guilds
 * @param {Client} client - Discord client
 * @param {Object} streamInfo - Stream information
 */
async function sendAnnouncement(client, streamInfo) {
    const { game, version, streamTime, bannerUrl } = streamInfo;

    console.log(`[Announcement] 📢 Sending announcement for ${game} ${version}...`);

    const allConfigs = await Config.find({});
    let sentCount = 0;

    for (const config of allConfigs) {
        try {
            const settings = await Settings.findOne({ guildId: config.guildId });

            // Check if auto-send is enabled
            if (!settings || !settings.autoSendEnabled) {
                continue;
            }

            // Check if this game is enabled via favoriteGames filter
            if (settings.favoriteGames?.enabled &&
                settings.favoriteGames.games &&
                settings.favoriteGames.games[game] === false) {
                // This guild doesn't want this game's announcements
                continue;
            }

            const guild = await client.guilds.fetch(config.guildId).catch(() => null);
            if (!guild) continue;

            // Send to main channel (NO role ping for announcement)
            if (settings.autoSendOptions?.channel !== false && config.channel) {
                await sendAnnouncementToChannel(client, config.channel, game, version, streamTime, bannerUrl);
                sentCount++;
            }

        } catch (error) {
            console.error(`[Announcement] Error for guild ${config.guildId}:`, error.message);
        }
    }

    console.log(`[Announcement] ✅ Sent to ${sentCount} guilds`);
}

/**
 * Send announcement to a channel
 */
async function sendAnnouncementToChannel(client, channelId, game, version, streamTime, bannerUrl) {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return;

    const permissions = channel.permissionsFor(client.user);
    if (!permissions || !permissions.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
        return;
    }

    const embed = new EmbedBuilder()
        .setColor('#FFA500') // Orange - upcoming event
        .setTitle(`📺 ${GAME_NAMES[game]} Special Program Announced!`)
        .setDescription(`**Version ${version}** livestream has been scheduled!`)
        .addFields(
            {
                name: '📅 Stream Time',
                value: `<t:${streamTime}:F>\n(<t:${streamTime}:R>)`,
                inline: false
            },
            {
                name: '🎁 What to Expect',
                value: '• New version preview\n• Redemption codes (3 codes will be dropped)\n• Character/weapon reveals',
                inline: false
            }
        )
        .setFooter({ text: '🤖 Auto-detected from Hoyolab • Codes will be sent automatically when available' })
        .setTimestamp();

    // Add Events Overview banner as large image
    if (bannerUrl) {
        embed.setImage(bannerUrl);
    }

    // NO ROLE PING - just info message
    await channel.send({
        content: `📢 **${GAME_NAMES[game]} Livestream Announcement**`,
        embeds: [embed]
    });
}

module.exports = {
    sendAnnouncement
};
