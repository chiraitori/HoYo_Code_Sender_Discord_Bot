const { EmbedBuilder } = require('discord.js');
const Config = require('../models/Config');
const Settings = require('../models/Settings');
const LivestreamTracking = require('../models/LivestreamTracking');
const { sendChannelMessage } = require('./discordMessageSender');
const languageManager = require('./language');
const { getKnownGuildIds } = require('./clusterGuilds');
const { shouldSendGameNotifications } = require('./notificationPreferences');
const { getLatestGuildRecords } = require('./guildRecords');
const { formatGameTitle } = require('./gameEmojis');

/**
 * Announcement system for Special Program detection
 * Sends announcement when livestream is detected (no role ping)
 */

const GAME_NAMES = {
    'genshin': 'Genshin Impact',
    'hkrpg': 'Honkai: Star Rail',
    'nap': 'Zenless Zone Zero'
};

const ANNOUNCEMENT_CLAIM_TTL_MS = 5 * 60 * 1000;

async function processInBatches(tasks, batchSize = 25) {
    const results = [];
    for (let index = 0; index < tasks.length; index += batchSize) {
        results.push(...await Promise.allSettled(
            tasks.slice(index, index + batchSize).map(task => task())
        ));
    }
    return results;
}

async function claimAnnouncementTarget(
    game,
    version,
    targetId,
    TrackingModel = LivestreamTracking,
    now = new Date()
) {
    const expiredBefore = new Date(now.getTime() - ANNOUNCEMENT_CLAIM_TTL_MS);
    await TrackingModel.updateOne(
        { game, version },
        {
            $pull: {
                announcementClaims: {
                    targetId,
                    claimedAt: { $lte: expiredBefore }
                }
            }
        }
    );

    const tracking = await TrackingModel.findOneAndUpdate(
        {
            game,
            version,
            announcementTargets: { $ne: targetId },
            'announcementClaims.targetId': { $ne: targetId }
        },
        {
            $push: {
                announcementClaims: {
                    targetId,
                    claimedAt: now
                }
            }
        },
        { new: true }
    );

    return Boolean(tracking);
}

async function releaseAnnouncementTarget(
    game,
    version,
    targetId,
    TrackingModel = LivestreamTracking
) {
    await TrackingModel.updateOne(
        { game, version },
        { $pull: { announcementClaims: { targetId } } }
    );
}

async function completeAnnouncementTarget(
    game,
    version,
    targetId,
    TrackingModel = LivestreamTracking
) {
    await TrackingModel.updateOne(
        { game, version },
        {
            $addToSet: { announcementTargets: targetId },
            $pull: { announcementClaims: { targetId } }
        }
    );
}

/**
 * Send announcement to all guilds
 * @param {Client} client - Discord client
 * @param {Object} streamInfo - Stream information
 */
async function sendAnnouncement(client, streamInfo) {
    const { game, version, streamTime, bannerUrl, streamTimeEstimated } = streamInfo;
    const botId = client.user?.id;
    if (!botId) {
        throw new Error('Cannot send livestream announcements before the bot is ready');
    }

    console.log(`[Announcement] 📢 Sending announcement for ${game} ${version}...`);

    const [allConfigs, allSettings] = await Promise.all([
        Config.find({}).sort({ _id: 1 }).lean(),
        Settings.find({}).sort({ _id: 1 }).lean()
    ]);
    const knownGuildIds = await getKnownGuildIds(client);
    const targets = getAnnouncementTargets(
        allConfigs,
        allSettings,
        game,
        knownGuildIds,
        botId
    );
    const tracking = await LivestreamTracking.findOne({ game, version });
    const deliveredTargets = new Set(tracking?.announcementTargets || []);
    const pendingTargets = targets.filter(target => !deliveredTargets.has(target.id));
    const tasks = [];

    for (const target of pendingTargets) {
        tasks.push(async () => {
            const claimed = await claimAnnouncementTarget(game, version, target.id);
            if (!claimed) {
                return false;
            }

            try {
                const sent = await sendAnnouncementToChannel(
                    client,
                    target.channelId,
                    target.config.guildId,
                    game,
                    version,
                    streamTime,
                    bannerUrl,
                    streamInfo.youtubeStreams,
                    streamTimeEstimated
                );
                if (sent) {
                    await completeAnnouncementTarget(game, version, target.id);
                } else {
                    await releaseAnnouncementTarget(game, version, target.id);
                }
                return sent;
            } catch (error) {
                await releaseAnnouncementTarget(game, version, target.id);
                console.error(
                    `[Announcement] Error for guild ${target.config.guildId}:`,
                    error.message
                );
                return false;
            }
        });
    }

    const results = await processInBatches(tasks);
    const sentCount = results.filter(
        result => result.status === 'fulfilled' && result.value === true
    ).length;

    const refreshedTracking = await LivestreamTracking.findOne({ game, version }).lean();
    const finalDeliveredTargets = new Set(refreshedTracking?.announcementTargets || []);
    const complete = targets.length > 0
        && targets.every(target => finalDeliveredTargets.has(target.id));

    if (tracking) {
        const update = { $set: { announcementSent: complete } };
        if (complete) {
            update.$addToSet = { announcementBots: botId };
        }
        await LivestreamTracking.updateOne({ game, version }, update);
    }

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

function getAnnouncementTargets(
    configs,
    settings,
    game,
    knownGuildIds = null,
    botId = 'legacy'
) {
    const settingsMap = new Map(
        getLatestGuildRecords(settings).map(row => [row.guildId, row])
    );
    const targets = new Map();

    for (const config of getLatestGuildRecords(configs)) {
        if (knownGuildIds && !knownGuildIds.has(config.guildId)) {
            continue;
        }

        const guildSettings = settingsMap.get(config.guildId);
        if (
            !shouldSendGameNotifications(guildSettings, game)
            || guildSettings?.livestreamAnnouncementsEnabled === false
            || guildSettings?.autoSendOptions?.channel === false
        ) {
            continue;
        }

        const channelId = config.livestreamChannel || config.channel;
        if (channelId) {
            const id = `${botId}:channel:${channelId}`;
            targets.set(id, { id, config, channelId });
        }
    }

    return [...targets.values()];
}

function wasAnnouncementSentForBot(tracking, botId) {
    if (!tracking || !botId) {
        return Boolean(tracking?.announcementSent);
    }

    if (tracking.announcementBots?.length > 0) {
        return tracking.announcementBots.includes(botId);
    }

    return Boolean(tracking.announcementSent);
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
        languageManager.getSupportFooter(guildId)
    ]);

    const embed = new EmbedBuilder()
        .setColor('#FFA500') // Orange - upcoming event
        .setTitle(formatGameTitle(game, title, { stripLeadingTv: true }))
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
    sendAnnouncement,
    getAnnouncementTargets,
    wasAnnouncementSentForBot,
    claimAnnouncementTarget,
    releaseAnnouncementTarget,
    completeAnnouncementTarget
};
