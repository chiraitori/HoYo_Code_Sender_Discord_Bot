const { EmbedBuilder } = require('discord.js');
const Config = require('../models/Config');
const Settings = require('../models/Settings');
const Code = require('../models/Code');
const LivestreamTracking = require('../models/LivestreamTracking');
const { getState } = require('./hoyolabAPI');
const { sendChannelMessage } = require('./discordMessageSender');
const { getKnownGuildIds } = require('./clusterGuilds');
const { shouldSendGameNotifications } = require('./notificationPreferences');
const { getRoleMention } = require('./roleMention');
const { reconcileConfiguredRoles } = require('./configuredRoles');
const { getLatestGuildRecords, countDuplicateGuildRecords } = require('./guildRecords');
const { GAME_EMOJIS, formatGameTitle } = require('./gameEmojis');
const {
    getCodeDeliveryId,
    getLegacyCodeDeliveryIds,
    getSharedCodeDeliveryIds,
    getPendingCodeDeliveries,
    getCodeDeliveryProgress
} = require('./livestreamDeliveryState');

/**
 * Auto-distribution system for livestream codes
 * Distributes codes to all guilds when STATE = 5 (Found)
 */

const GAME_NAMES = {
    'genshin': 'Genshin Impact',
    'hkrpg': 'Honkai: Star Rail',
    'nap': 'Zenless Zone Zero'
};

const REDEEM_URLS = {
    'genshin': 'https://genshin.hoyoverse.com/en/gift',
    'hkrpg': 'https://hsr.hoyoverse.com/gift',
    'nap': 'https://zenless.hoyoverse.com/redemption'
};

const ROLE_MAPPING = {
    'genshin': 'genshinRole',
    'hkrpg': 'hsrRole',
    'nap': 'zzzRole'
};

function getDeliveryTargets(configs, settings, game, botId = null, knownGuildIds = null) {
    const latestConfigs = getLatestGuildRecords(configs);
    const latestSettings = getLatestGuildRecords(settings);
    const settingsMap = new Map(latestSettings.map(row => [row.guildId, row]));
    const targets = new Map();

    for (const config of latestConfigs) {
        if (knownGuildIds && !knownGuildIds.has(config.guildId)) {
            continue;
        }

        const guildSettings = settingsMap.get(config.guildId);
        if (!shouldSendGameNotifications(guildSettings, game)) {
            continue;
        }

        const channelId = config.livestreamChannel || config.channel;
        if (guildSettings?.autoSendOptions?.channel !== false && channelId) {
            const targetId = `${botId || 'legacy'}:channel:${channelId}`;
            targets.set(targetId, {
                id: targetId,
                type: 'channel',
                config
            });
        }

        const threadMapping = {
            genshin: config.forumThreads?.genshin,
            hkrpg: config.forumThreads?.hsr,
            nap: config.forumThreads?.zzz
        };
        const threadId = threadMapping[game];
        if (
            guildSettings?.autoSendOptions?.threads !== false
            && threadId
            && threadId !== channelId
        ) {
            const targetId = `${botId || 'legacy'}:thread:${threadId}`;
            targets.set(targetId, {
                id: targetId,
                type: 'thread',
                config
            });
        }
    }

    return [...targets.values()];
}

function getPendingDeliveryTargets(targets, deliveredTargetIds) {
    const delivered = new Set(deliveredTargetIds || []);
    return targets.filter(target => !delivered.has(target.id));
}

function getDeliveryProgress(targets, deliveredTargetIds, pendingTargets, results) {
    const delivered = new Set(deliveredTargetIds || []);
    const successfulTargetIds = results.flatMap((result, index) => (
        result.status === 'fulfilled' && result.value === true
            ? [pendingTargets[index].id]
            : []
    ));
    successfulTargetIds.forEach(targetId => delivered.add(targetId));

    return {
        successfulTargetIds,
        deliveredTargetIds: delivered,
        failCount: results.length - successfulTargetIds.length,
        distributed: targets.every(target => delivered.has(target.id))
    };
}

/**
 * Check and distribute codes for all games
 * @param {Client} client - Discord client
 */
async function checkAndDistribute(client) {
    const games = ['genshin', 'hkrpg', 'nap'];

    for (const game of games) {
        try {
            await distributeIfReady(client, game);
        } catch (error) {
            console.error(`[Auto-Distribution] Error for ${game}:`, error);
        }
    }
}

/**
 * Distribute codes if ready (STATE = 5)
 * @param {Client} client - Discord client
 * @param {string} game - Game identifier
 */
async function distributeIfReady(client, game, version = null, codes = null) {
    const tracking = version
        ? await LivestreamTracking.findOne({ game, version })
        : await LivestreamTracking.findOne({ game }).sort({ streamTime: -1, updatedAt: -1 });

    if (!tracking) {
        return; // No tracking setup
    }

    const trackingVersion = tracking.version || '1.0';
    const botId = client.user?.id;
    if (!botId) {
        throw new Error('Cannot distribute livestream codes before the bot is ready');
    }

    const state = await getState(game, trackingVersion, botId);

    // Only distribute if STATE = 5 (Found) and not already distributed
    if (state !== 5) {
        return;
    }

    console.log(`[Auto-Distribution] 🚀 Distributing new codes for ${game}...`);
    const distributionTracking = codes
        ? { ...tracking.toObject(), codes }
        : tracking;
    const distributionData = typeof distributionTracking.toObject === 'function'
        ? distributionTracking.toObject()
        : distributionTracking;
    const distributionCodes = distributionData.codes?.filter(codeData => codeData.code) || [];
    if (distributionCodes.length === 0) {
        return;
    }

    // Get all guilds with auto-send enabled
    const [allConfigs, allSettings] = await Promise.all([
        Config.find({}).sort({ _id: 1 }).lean(),
        Settings.find({}).sort({ _id: 1 }).lean()
    ]);
    const duplicateConfigs = countDuplicateGuildRecords(allConfigs);
    const duplicateSettings = countDuplicateGuildRecords(allSettings);
    if (duplicateConfigs || duplicateSettings) {
        console.warn(
            `[Auto-Distribution] Ignoring duplicate DB rows: ${duplicateConfigs} config, `
            + `${duplicateSettings} settings (newest row per guild wins)`
        );
    }
    const knownGuildIds = await getKnownGuildIds(client);
    const targets = getDeliveryTargets(
        allConfigs,
        allSettings,
        game,
        botId,
        knownGuildIds
    );
    await reconcileConfiguredRoles(
        client,
        [...new Set(targets.map(target => target.config))],
        game
    );
    if (targets.length === 0) {
        console.warn(`[Auto-Distribution] No eligible delivery targets for ${game}; will retry`);
        return;
    }

    const regularCodeRows = await Code.find({
        game,
        code: { $in: distributionCodes.map(codeData => codeData.code) }
    }).lean();
    const storedCodeDeliveryIds = tracking.distributedCodeTargets || [];
    const legacyCodeDeliveryIds = storedCodeDeliveryIds.length === 0
        ? getLegacyCodeDeliveryIds(tracking.distributedTargets, distributionCodes)
        : [];
    const sharedCodeDeliveryIds = getSharedCodeDeliveryIds(targets, regularCodeRows);
    const deliveredCodeTargetIds = new Set([
        ...storedCodeDeliveryIds,
        ...legacyCodeDeliveryIds,
        ...sharedCodeDeliveryIds
    ]);
    const synchronizedCodeDeliveryIds = [...new Set([
        ...legacyCodeDeliveryIds,
        ...sharedCodeDeliveryIds
    ])];
    if (synchronizedCodeDeliveryIds.length > 0) {
        await LivestreamTracking.updateOne(
            { game, version: trackingVersion },
            { $addToSet: { distributedCodeTargets: { $each: synchronizedCodeDeliveryIds } } }
        );
    }

    const pendingDeliveries = getPendingCodeDeliveries(
        targets,
        distributionCodes,
        deliveredCodeTargetIds
    );
    if (pendingDeliveries.length === 0) {
        await LivestreamTracking.findOneAndUpdate(
            { game, version: trackingVersion },
            {
                $set: { distributed: true },
                $addToSet: { distributedBots: botId }
            },
            { upsert: false }
        );
        return;
    }

    const embeds = new Map();
    for (const delivery of pendingDeliveries) {
        const signature = delivery.codes.map(codeData => codeData.code).sort().join(',');
        if (!embeds.has(signature)) {
            embeds.set(signature, await buildCodesEmbed(game, {
                ...distributionData,
                codes: delivery.codes
            }));
        }
        delivery.embed = embeds.get(signature);
    }

    const results = [];
    const batchSize = 25;
    for (let index = 0; index < pendingDeliveries.length; index += batchSize) {
        const batchDeliveries = pendingDeliveries.slice(index, index + batchSize);
        const batchResults = await Promise.allSettled(batchDeliveries.map(delivery => (
            delivery.target.type === 'channel'
                ? sendToChannel(client, delivery.target.config, game, delivery.embed)
                : sendToThread(client, delivery.target.config, game, delivery.embed)
        )));
        results.push(...batchResults);

        const successfulBatchCodeTargetIds = batchResults.flatMap((result, resultIndex) => (
            result.status === 'fulfilled' && result.value === true
                ? batchDeliveries[resultIndex].codes.map(
                    codeData => getCodeDeliveryId(batchDeliveries[resultIndex].target.id, codeData)
                )
                : []
        ));
        if (successfulBatchCodeTargetIds.length > 0) {
            const notifiedTargetsByCode = new Map();
            batchResults.forEach((result, resultIndex) => {
                if (result.status !== 'fulfilled' || result.value !== true) {
                    return;
                }
                const delivery = batchDeliveries[resultIndex];
                for (const codeData of delivery.codes) {
                    if (!notifiedTargetsByCode.has(codeData.code)) {
                        notifiedTargetsByCode.set(codeData.code, new Set());
                    }
                    notifiedTargetsByCode.get(codeData.code).add(delivery.target.id);
                }
            });

            try {
                await Code.bulkWrite([...notifiedTargetsByCode].map(([code, targetIds]) => ({
                    updateOne: {
                        filter: { game, code },
                        update: {
                            $setOnInsert: { game, code, isExpired: false, timestamp: new Date() },
                            $addToSet: { notifiedTargets: { $each: [...targetIds] } }
                        },
                        upsert: true
                    }
                })), { ordered: false });
            } catch (error) {
                console.error(
                    `[Auto-Distribution] Could not synchronize shared delivery markers for ${game}:`,
                    error.message
                );
            }

            await LivestreamTracking.updateOne(
                { game, version: trackingVersion },
                { $addToSet: { distributedCodeTargets: { $each: successfulBatchCodeTargetIds } } }
            );
        }
    }
    const progress = getCodeDeliveryProgress(
        targets,
        distributionCodes,
        deliveredCodeTargetIds,
        pendingDeliveries,
        results
    );
    const { successfulCodeTargetIds, failCount, distributed } = progress;

    for (let index = 0; index < results.length; index++) {
        const result = results[index];
        if (result.status === 'rejected') {
            console.error(
                `[Auto-Distribution] Failed ${pendingDeliveries[index].target.id}:`,
                result.reason?.message || result.reason
            );
        }
    }

    const update = {
        $set: { distributed }
    };
    if (successfulCodeTargetIds.length > 0) {
        update.$addToSet = {
            distributedCodeTargets: { $each: successfulCodeTargetIds }
        };
    }
    if (distributed) {
        update.$addToSet = {
            ...(update.$addToSet || {}),
            distributedBots: botId
        };
    }

    await LivestreamTracking.findOneAndUpdate(
        { game, version: trackingVersion },
        update,
        { upsert: false }
    );

    console.log(
        `[Auto-Distribution] Delivered ${successfulCodeTargetIds.length} new ${game} code-targets `
        + `(${failCount} targets failed, ${progress.deliveredCodeTargetIds.size} total recorded)`
    );
}

/**
 * Fetch Events Overview banner (available ~15 min after livestream)
 */
async function fetchEventsBanner(accountId, game) {
    try {
        const axios = require('axios');

        const url = `https://bbs-api-os.hoyolab.com/community/post/wapi/userPost?uid=${accountId}`;
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'x-rpc-client_type': '4'
            }
        });

        const posts = response.data?.data?.list || [];

        // Look for Events Overview post
        for (const postData of posts.slice(0, 10)) {
            const post = postData.post;
            const title = post.subject.toLowerCase();

            if (title.includes('event') && (title.includes('overview') || title.includes('review'))) {
                // Fetch full post
                const detailUrl = `https://bbs-api-os.hoyolab.com/community/post/wapi/getPostFull?post_id=${post.post_id}`;
                const detailResponse = await axios.get(detailUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'x-rpc-client_type': '4'
                    }
                });

                const postWrapper = detailResponse.data?.data?.post;
                if (postWrapper && (postWrapper.cover_list?.[0] || postWrapper.image_list?.[0])) {
                    const bannerUrl = postWrapper.cover_list?.[0]?.url || postWrapper.image_list?.[0]?.url;
                    console.log(`[Distribution] 🎨 Found Events Overview banner for ${game}`);
                    return bannerUrl;
                }
            }
        }

        return null;
    } catch (error) {
        console.error('[Distribution] Error fetching Events banner:', error.message);
        return null;
    }
}

/**
 * Send codes to main channel
 * @param {Client} client - Discord client
 * @param {Object} config - Guild config
 * @param {string} game - Game identifier
 * @param {EmbedBuilder} embed - Pre-built livestream code embed
 */
async function sendToChannel(client, config, game, embed) {
    // Use livestreamChannel if configured, otherwise fall back to regular channel
    const channelId = config.livestreamChannel || config.channel;

    if (!channelId) return;

    const channel = client.channels.cache.get(channelId);

    // Check permissions
    const permissions = channel?.permissionsFor(client.user);
    if (permissions && !permissions.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
        return false;
    }

    // Get role to mention
    const roleField = ROLE_MAPPING[game];
    const roleId = config[roleField];
    const roleMention = getRoleMention(roleId);

    await sendChannelMessage(client, channelId, {
        content: `${roleMention.content}${roleMention.content ? ' ' : ''}${GAME_EMOJIS[game]} **New ${GAME_NAMES[game]} Livestream Codes!**`,
        embeds: [embed],
        allowedMentions: roleMention.allowedMentions
    });
    return true;
}

/**
 * Send codes to forum thread
 * @param {Client} client - Discord client
 * @param {Object} config - Guild config
 * @param {string} game - Game identifier
 * @param {EmbedBuilder} embed - Pre-built livestream code embed
 */
async function sendToThread(client, config, game, embed) {
    const threadMapping = {
        'genshin': config.forumThreads?.genshin,
        'hkrpg': config.forumThreads?.hsr,
        'nap': config.forumThreads?.zzz
    };

    const threadId = threadMapping[game];
    if (!threadId) return false;

    const thread = client.channels.cache.get(threadId);

    // Check permissions
    const permissions = thread?.permissionsFor(client.user);
    if (permissions && !permissions.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
        return false;
    }

    // Get role to mention
    const roleField = ROLE_MAPPING[game];
    const roleId = config[roleField];
    const roleMention = getRoleMention(roleId);

    await sendChannelMessage(client, threadId, {
        content: `${roleMention.content}${roleMention.content ? ' ' : ''}${GAME_EMOJIS[game]} **New ${GAME_NAMES[game]} Livestream Codes!**`,
        embeds: [embed],
        allowedMentions: roleMention.allowedMentions
    });
    return true;
}

/**
 * Build embed for codes
 * @param {string} game - Game identifier
 * @param {Object} tracking - Tracking data
 * @returns {Promise<EmbedBuilder>} Embed
 */
async function buildCodesEmbed(game, tracking) {
    // Try to fetch Events Overview banner (available ~15 min after livestream)
    const OFFICIAL_ACCOUNTS = {
        'genshin': '1015537',
        'hkrpg': '172534910',
        'nap': '219270333'
    };

    let finalBanner = tracking.bannerUrl; // Start with Special Program banner

    // Try to get Events Overview banner
    const eventsBanner = await fetchEventsBanner(OFFICIAL_ACCOUNTS[game], game);
    if (eventsBanner) {
        finalBanner = eventsBanner; // Use Events banner if available

        // Update tracking with better banner for future use
        await LivestreamTracking.findOneAndUpdate(
            { game, version: tracking.version },
            { bannerUrl: eventsBanner }
        );
    }

    const embed = new EmbedBuilder()
        .setColor('#FFD700') // Gold color for livestream codes
        .setTitle(formatGameTitle(game, `${GAME_NAMES[game]} Livestream Codes`))
        .setDescription(`**Version ${tracking.version || 'N/A'}** - Found ${tracking.codes.length} codes!`)
        .setTimestamp();

    // Add codes with rewards
    if (tracking.codes && tracking.codes.length > 0) {
        for (let i = 0; i < tracking.codes.length; i++) {
            const codeData = tracking.codes[i];
            let expireText = 'Unknown';

            if (codeData.expireAt && codeData.expireAt > 0) {
                expireText = `<t:${codeData.expireAt}:R>`;
            }

            // Include rewards if available
            const rewardText = codeData.title ? `\n**Rewards:** ${codeData.title}` : '';

            embed.addFields({
                name: `Code ${i + 1}`,
                value: `\`${codeData.code}\`${rewardText}\n**Expires:** ${expireText}`,
                inline: true
            });
        }
    }

    // Add redeem link
    embed.addFields({
        name: '🔗 Redeem Here',
        value: `[Click to Redeem](${REDEEM_URLS[game]})`,
        inline: false
    });

    const youtubeStreams = tracking.youtubeStreams?.length
        ? tracking.youtubeStreams
        : tracking.youtubeUrl
            ? [{ locale: 'en', url: tracking.youtubeUrl, status: tracking.youtubeStatus }]
            : [];
    const streamLinks = [
        { locale: 'en', label: '🇬🇧 English' },
        { locale: 'ja', label: '🇯🇵 日本語' }
    ].map(({ locale, label }) => {
        const stream = youtubeStreams.find(item => item.locale === locale);
        return stream?.url ? `${label}: [Watch](${stream.url})` : null;
    }).filter(Boolean);

    if (streamLinks.length > 0) {
        embed.addFields({
            name: '▶️ Official Livestream',
            value: streamLinks.join('\n'),
            inline: false
        });
    }

    // Add banner as large image at bottom
    if (finalBanner) {
        embed.setImage(finalBanner);
    }

    embed.setFooter({ text: '🎁 From Official Livestream' });

    return embed;
}

module.exports = {
    checkAndDistribute,
    distributeIfReady,
    getDeliveryTargets,
    getPendingDeliveryTargets,
    getDeliveryProgress
};
