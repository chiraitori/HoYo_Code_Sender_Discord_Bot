const { EmbedBuilder } = require('discord.js');
const Config = require('../models/Config');
const Settings = require('../models/Settings');
const LivestreamTracking = require('../models/LivestreamTracking');
const { getState } = require('./hoyolabAPI');

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
async function distributeIfReady(client, game) {
    const tracking = await LivestreamTracking.findOne({ game });

    if (!tracking) {
        return; // No tracking setup
    }

    const version = tracking.version || '1.0';
    const state = await getState(game, version);

    // Only distribute if STATE = 5 (Found) and not already distributed
    if (state !== 5) {
        return;
    }

    console.log(`[Auto-Distribution] 🚀 Distributing codes for ${game}...`);

    // Get all guilds with auto-send enabled
    const allConfigs = await Config.find({});
    let successCount = 0;
    let failCount = 0;

    for (const config of allConfigs) {
        try {
            const settings = await Settings.findOne({ guildId: config.guildId });

            // Check if auto-send is enabled for this guild
            if (!settings || !settings.autoSendEnabled) {
                continue;
            }

            // Check if this game is enabled via favoriteGames filter
            if (settings.favoriteGames?.enabled &&
                settings.favoriteGames.games &&
                settings.favoriteGames.games[game] === false) {
                // This guild doesn't want this game's codes
                continue;
            }

            const guild = await client.guilds.fetch(config.guildId).catch(() => null);
            if (!guild) {
                continue;
            }

            // Send to main channel
            if (settings.autoSendOptions?.channel !== false && config.channel) {
                await sendToChannel(client, config, game, tracking);
                successCount++;
            }

            // Send to forum threads
            if (settings.autoSendOptions?.threads !== false && config.forumThreads) {
                await sendToThread(client, config, game, tracking);
            }

        } catch (error) {
            console.error(`[Auto-Distribution] Error for guild ${config.guildId}:`, error);
            failCount++;
        }
    }

    // Mark as distributed
    await LivestreamTracking.findOneAndUpdate(
        { game },
        { distributed: true },
        { upsert: true }
    );

    console.log(`[Auto-Distribution] ✅ Distributed ${game} codes to ${successCount} guilds (${failCount} failed)`);
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
 * @param {Object} tracking - Tracking data
 */
async function sendToChannel(client, config, game, tracking) {
    // Use livestreamChannel if configured, otherwise fall back to regular channel
    const channelId = config.livestreamChannel || config.channel;

    if (!channelId) return;

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return;

    // Check permissions
    const permissions = channel.permissionsFor(client.user);
    if (!permissions || !permissions.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
        return;
    }

    // Get role to mention
    const roleField = ROLE_MAPPING[game];
    const roleId = config[roleField];
    let roleMention = '';

    if (roleId && permissions.has('MentionEveryone')) {
        roleMention = `<@&${roleId}> `;
    }

    // Build embed (will fetch Events banner inside)
    const embed = await buildCodesEmbed(game, tracking);

    await channel.send({
        content: `${roleMention}🎉 **New ${GAME_NAMES[game]} Livestream Codes!**`,
        embeds: [embed]
    });
}

/**
 * Send codes to forum thread
 * @param {Client} client - Discord client
 * @param {Object} config - Guild config
 * @param {string} game - Game identifier
 * @param {Object} tracking - Tracking data
 */
async function sendToThread(client, config, game, tracking) {
    const threadMapping = {
        'genshin': config.forumThreads?.genshin,
        'hkrpg': config.forumThreads?.hsr,
        'nap': config.forumThreads?.zzz
    };

    const threadId = threadMapping[game];
    if (!threadId) return;

    const thread = await client.channels.fetch(threadId).catch(() => null);
    if (!thread) return;

    // Check permissions
    const permissions = thread.permissionsFor(client.user);
    if (!permissions || !permissions.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
        return;
    }

    // Get role to mention
    const roleField = ROLE_MAPPING[game];
    const roleId = config[roleField];
    let roleMention = '';

    if (roleId && permissions.has('MentionEveryone')) {
        roleMention = `<@&${roleId}> `;
    }

    // Build embed (will fetch Events banner inside)
    const embed = await buildCodesEmbed(game, tracking);

    await thread.send({
        content: `${roleMention}🎉 **New ${GAME_NAMES[game]} Livestream Codes!**`,
        embeds: [embed]
    });
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
        .setTitle(`🎮 ${GAME_NAMES[game]} Livestream Codes`)
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

    // Add banner as large image at bottom
    if (finalBanner) {
        embed.setImage(finalBanner);
    }

    embed.setFooter({ text: '🎁 From Official Livestream' });

    return embed;
}

module.exports = {
    checkAndDistribute,
    distributeIfReady
};
