const { EmbedBuilder } = require('discord.js');
const Config = require('../models/Config');
const Settings = require('../models/Settings');
const { sendChannelMessage } = require('./discordMessageSender');

/**
 * Announcement system for Special Program detection
 * Sends announcement when livestream is detected (no role ping)
 */

const GAME_NAMES = {
    'genshin': 'Genshin Impact',
    'hkrpg': 'Honkai: Star Rail',
    'nap': 'Zenless Zone Zero'
};

async function processInBatches(tasks, batchSize = 25) {
    const results = [];
    for (let index = 0; index < tasks.length; index += batchSize) {
        results.push(...await Promise.allSettled(
            tasks.slice(index, index + batchSize).map(task => task())
        ));
    }
    return results;
}

/**
 * Send announcement to all guilds
 * @param {Client} client - Discord client
 * @param {Object} streamInfo - Stream information
 */
async function sendAnnouncement(client, streamInfo) {
    const { game, version, streamTime, bannerUrl, streamTimeEstimated } = streamInfo;

    console.log(`[Announcement] 📢 Sending announcement for ${game} ${version}...`);

    const [allConfigs, allSettings] = await Promise.all([
        Config.find({}).lean(),
        Settings.find({ autoSendEnabled: true }).lean()
    ]);
    const settingsMap = new Map(allSettings.map(settings => [settings.guildId, settings]));
    const tasks = [];

    for (const config of allConfigs) {
        const settings = settingsMap.get(config.guildId);
        if (!settings) {
            continue;
        }

        if (
            settings.favoriteGames?.enabled
            && settings.favoriteGames.games?.[game] === false
        ) {
            continue;
        }

        if (settings.autoSendOptions?.channel !== false && config.channel) {
            tasks.push(() => sendAnnouncementToChannel(
                    client,
                    config.livestreamChannel || config.channel,
                    game,
                    version,
                    streamTime,
                    bannerUrl,
                    streamInfo.youtubeStreams,
                    streamTimeEstimated
                ).catch(error => {
                    console.error(`[Announcement] Error for guild ${config.guildId}:`, error.message);
                    return false;
                })
            );
        }
    }

    const results = await processInBatches(tasks);
    const sentCount = results.filter(
        result => result.status === 'fulfilled' && result.value === true
    ).length;

    console.log(`[Announcement] ✅ Sent to ${sentCount} guilds`);
    return sentCount;
}

/**
 * Send announcement to a channel
 */
async function sendAnnouncementToChannel(
    client,
    channelId,
    game,
    version,
    streamTime,
    bannerUrl,
    youtubeStreams,
    streamTimeEstimated
) {
    const channel = client.channels.cache.get(channelId);

    const permissions = channel?.permissionsFor(client.user);
    if (permissions && !permissions.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
        return false;
    }

    const embed = buildLivestreamAnnouncementEmbed({
        game,
        version,
        streamTime,
        bannerUrl,
        youtubeStreams,
        streamTimeEstimated
    });

    await sendChannelMessage(client, channelId, {
        content: `📢 **${GAME_NAMES[game]} Livestream Announcement**`,
        embeds: [embed]
    });
    return true;
}

function buildLivestreamAnnouncementEmbed({
    game,
    version,
    streamTime,
    bannerUrl,
    youtubeStreams = [],
    streamTimeEstimated = false
}) {
    const embed = new EmbedBuilder()
        .setColor('#FFA500') // Orange - upcoming event
        .setTitle(`📺 ${GAME_NAMES[game]} Special Program Announced!`)
        .setDescription(`**Version ${version}** livestream has been scheduled!`)
        .addFields(
            {
                name: streamTimeEstimated ? '📅 Estimated Stream Time' : '📅 Stream Time',
                value: `<t:${streamTime}:F>\n(<t:${streamTime}:R>)`,
                inline: false
            },
            {
                name: '🎁 What to Expect',
                value: '• New version preview\n• Redemption codes (3 codes will be dropped)\n• Character/weapon reveals',
                inline: false
            }
        )
        .setFooter({ text: '🤖 Auto-detected from official HoYo sources • Codes will be sent automatically when available' })
        .setTimestamp();

    const streamLinks = [
        { locale: 'en', label: '🇬🇧 English' },
        { locale: 'ja', label: '🇯🇵 日本語' }
    ].map(({ locale, label }) => {
        const stream = youtubeStreams.find(item => item.locale === locale);
        if (!stream?.url) {
            return null;
        }

        const status = stream.status === 'live'
            ? 'LIVE'
            : stream.status === 'upcoming'
                ? 'Upcoming'
                : 'Official channel';
        return `${label}: [${status}](${stream.url})`;
    }).filter(Boolean);

    if (streamLinks.length > 0) {
        embed.addFields({
            name: '▶️ Watch on YouTube',
            value: streamLinks.join('\n'),
            inline: false
        });
    }

    // Add Events Overview banner as large image
    if (bannerUrl) {
        embed.setImage(bannerUrl);
    }

    return embed;
}

module.exports = {
    buildLivestreamAnnouncementEmbed,
    sendAnnouncement
};
