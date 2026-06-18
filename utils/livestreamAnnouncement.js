const { EmbedBuilder } = require('discord.js');
const Config = require('../models/Config');
const Settings = require('../models/Settings');
const { sendChannelMessage } = require('./discordMessageSender');
const languageManager = require('./language');

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

        if (settings.livestreamAnnouncementsEnabled === false) {
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
                    config.guildId,
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
    guildId,
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

    const embed = await buildLivestreamAnnouncementEmbed({
        guildId,
        game,
        version,
        streamTime,
        bannerUrl,
        youtubeStreams,
        streamTimeEstimated
    });

    await sendChannelMessage(client, channelId, {
        content: await languageManager.getString(
            'livestream.announcement.content',
            guildId,
            { game: GAME_NAMES[game] }
        ),
        embeds: [embed]
    });
    return true;
}

function buildLivestreamAnnouncementEmbed({
    guildId,
    game,
    version,
    streamTime,
    bannerUrl,
    youtubeStreams = [],
    streamTimeEstimated = false
}) {
    return buildLivestreamAnnouncementEmbedLocalized({
        guildId,
        game,
        version,
        streamTime,
        bannerUrl,
        youtubeStreams,
        streamTimeEstimated
    });
}

async function buildLivestreamAnnouncementEmbedLocalized({
    guildId,
    game,
    version,
    streamTime,
    bannerUrl,
    youtubeStreams = [],
    streamTimeEstimated = false
}) {
    const [
        title,
        description,
        streamTimeName,
        estimatedStreamTimeName,
        whatToExpectName,
        whatToExpectValue,
        watchOnYoutubeName,
        liveStatus,
        upcomingStatus,
        officialChannelStatus,
        supportMsg
    ] = await Promise.all([
        languageManager.getString('livestream.announcement.title', guildId, { game: GAME_NAMES[game] }),
        languageManager.getString('livestream.announcement.description', guildId, { version }),
        languageManager.getString('livestream.announcement.streamTime', guildId),
        languageManager.getString('livestream.announcement.estimatedStreamTime', guildId),
        languageManager.getString('livestream.announcement.whatToExpect', guildId),
        languageManager.getString('livestream.announcement.whatToExpectValue', guildId),
        languageManager.getString('livestream.announcement.watchOnYoutube', guildId),
        languageManager.getString('livestream.announcement.status.live', guildId),
        languageManager.getString('livestream.announcement.status.upcoming', guildId),
        languageManager.getString('livestream.announcement.status.officialChannel', guildId),
        languageManager.getString('common.supportMsg', guildId)
    ]);

    const embed = new EmbedBuilder()
        .setColor('#FFA500') // Orange - upcoming event
        .setTitle(title)
        .setDescription(description)
        .addFields(
            {
                name: streamTimeEstimated ? estimatedStreamTimeName : streamTimeName,
                value: `<t:${streamTime}:F>\n(<t:${streamTime}:R>)`,
                inline: false
            },
            {
                name: whatToExpectName,
                value: whatToExpectValue,
                inline: false
            }
        )
        .setFooter({ text: supportMsg })
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
            ? liveStatus
            : stream.status === 'upcoming'
                ? upcomingStatus
                : officialChannelStatus;
        return `${label}: [${status}](${stream.url})`;
    }).filter(Boolean);

    if (streamLinks.length > 0) {
        embed.addFields({
            name: watchOnYoutubeName,
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
