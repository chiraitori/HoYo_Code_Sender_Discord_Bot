const { EmbedBuilder } = require('discord.js');
const LivestreamTracking = require('../models/LivestreamTracking');
const Code = require('../models/Code');
const { getState, fetchLivestreamCodes, parseAndSaveCodes, getStateName } = require('./hoyolabAPI');
const { distributeIfReady } = require('./livestreamDistribution');
const { sendAnnouncement, wasAnnouncementSentForBot } = require('./livestreamAnnouncement');

/**
 * Livestream Code Checker
 * Runs every 3 minutes to check for new livestream codes
 */

const GAMES = ['genshin', 'hkrpg', 'nap'];
const CHECK_INTERVAL = 3 * 60 * 1000; // 3 minutes in milliseconds
const ANNOUNCEMENT_MIN_LEAD_SECONDS = 5 * 60;
const parsedAnnouncementLookaheadDays = Number.parseInt(process.env.LIVESTREAM_ANNOUNCEMENT_LOOKAHEAD_DAYS || '7', 10);
const ANNOUNCEMENT_LOOKAHEAD_DAYS = Number.isFinite(parsedAnnouncementLookaheadDays)
    ? parsedAnnouncementLookaheadDays
    : 7;
const ANNOUNCEMENT_LOOKAHEAD_SECONDS = Math.max(1, ANNOUNCEMENT_LOOKAHEAD_DAYS) * 24 * 60 * 60;

let checkerInterval = null;
let checkerRunning = false;

/**
 * Start the livestream checker
 * @param {Client} client - Discord client
 */
function startLivestreamChecker(client) {
    if (checkerInterval) {
        console.log('[Livestream Checker] Already running');
        return;
    }

    console.log('[Livestream Checker] Starting...');

    // Run immediately on start
    checkAllGames(client).catch(error => {
        console.error('[Livestream Checker] Initial check failed:', error);
    });

    // Then run every 3 minutes
    checkerInterval = setInterval(() => {
        checkAllGames(client).catch(error => {
            console.error('[Livestream Checker] Scheduled check failed:', error);
        });
    }, CHECK_INTERVAL);
}

/**
 * Stop the livestream checker
 */
function stopLivestreamChecker() {
    if (checkerInterval) {
        clearInterval(checkerInterval);
        checkerInterval = null;
        console.log('[Livestream Checker] Stopped');
    }
}

/**
 * Check all games for livestream codes
 * @param {Client} client - Discord client
 */
async function checkAllGames(client) {
    if (checkerRunning) {
        console.log('[Livestream Checker] Skipping because the previous check is still active');
        return;
    }

    checkerRunning = true;
    console.log('[Livestream Checker] Running check...');

    try {
        await Promise.all(GAMES.map(async game => {
            try {
                await checkGame(client, game);
            } catch (error) {
                console.error(`[Livestream Checker] Error checking ${game}:`, error);
            }
        }));
    } finally {
        checkerRunning = false;
    }
}

/**
 * Check a single game for livestream codes
 * @param {Client} client - Discord client
 * @param {string} game - Game identifier
 */
async function checkGame(client, game) {
    // Get tracking data
    const tracking = await LivestreamTracking.findOne({ game }).sort({ streamTime: -1, updatedAt: -1 });

    if (!tracking) {
        return; // No tracking setup for this game
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const maxSearchAge = 48 * 60 * 60;
    if (!tracking.found && tracking.streamTime < currentTime - maxSearchAge) {
        console.log(`[Livestream Checker] ${game} tracking is older than 48 hours; closing it`);
        tracking.distributed = true;
        await tracking.save();
        return;
    }

    const version = tracking.version || '1.0';
    await announceUpcomingIfNeeded(client, tracking);

    const botId = client.user?.id;
    const state = await getState(game, version, botId);

    console.log(`[Livestream Checker] ${game} - State: ${state} (${getStateName(state)})`);

    // Only process if STATE = 4 (Searching) or 5 (Found)
    if (state === 4) {
        // STATE 4: Searching - Poll API
        const response = await fetchLivestreamCodes(game);

        if (response) {
            const allCodesFound = await parseAndSaveCodes(response, game, version);

            if (allCodesFound) {
                console.log(`[Livestream Checker] ✅ All codes found for ${game}!`);

                // Save codes to database for distribution
                const updatedTracking = await LivestreamTracking.findOne({ game, version });
                if (updatedTracking && updatedTracking.codes) {
                    const distributionCodes = updatedTracking.codes.filter(codeData => codeData.code);

                    if (distributionCodes.length === 0) {
                        return;
                    }

                    const timestamp = new Date();
                    await Code.bulkWrite(distributionCodes.map(codeData => ({
                        updateOne: {
                            filter: { game, code: codeData.code },
                            update: {
                                $set: {
                                    isExpired: false,
                                    timestamp
                                },
                                $setOnInsert: {
                                    game,
                                    code: codeData.code
                                }
                            },
                            upsert: true
                        }
                    })));

                    // AUTO-DISTRIBUTE: Pop codes immediately when all 3 found
                    console.log(`[Livestream Checker] 🚀 Triggering auto-distribution for ${game}...`);
                    await distributeIfReady(client, game, version, distributionCodes);
                }
            }
        }
    } else if (state === 5) {
        console.log(`[Livestream Checker] ${game} codes found but not distributed; triggering distribution...`);
        await distributeIfReady(client, game, version);
    }

    // Update tracking message
    const latestState = await getState(game, version, botId);
    const latestTracking = await LivestreamTracking.findOne({ game, version });
    await updateTrackingMessage(client, game, latestState, latestTracking || tracking);
}

async function announceUpcomingIfNeeded(client, tracking) {
    if (
        !client
        || !tracking
        || tracking.disabled
        || wasAnnouncementSentForBot(tracking, client.user?.id)
    ) {
        return;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const secondsUntilStream = tracking.streamTime - currentTime;
    if (
        !tracking.streamTime
        || secondsUntilStream <= ANNOUNCEMENT_MIN_LEAD_SECONDS
        || secondsUntilStream > ANNOUNCEMENT_LOOKAHEAD_SECONDS
    ) {
        return;
    }

    console.log(`[Livestream Checker] 📢 Sending missed upcoming announcement for ${tracking.game} ${tracking.version}`);
    await sendAnnouncement(client, {
        game: tracking.game,
        version: tracking.version,
        streamTime: tracking.streamTime,
        bannerUrl: tracking.bannerUrl,
        streamTimeEstimated: tracking.streamTimeEstimated,
        youtubeStreams: tracking.youtubeStreams || []
    });

}

/**
 * Update the tracking message in Discord
 * @param {Client} client - Discord client
 * @param {string} game - Game identifier
 * @param {number} state - Current state
 * @param {Object} tracking - Tracking data
 */
async function updateTrackingMessage(client, game, state, tracking) {
    if (!tracking.trackingChannel || !tracking.trackingMessage) {
        return; // No tracking message setup
    }

    try {
        const channel = await client.channels.fetch(tracking.trackingChannel);
        if (!channel) return;

        const message = await channel.messages.fetch(tracking.trackingMessage);
        if (!message) return;

        // Build embed
        const embed = new EmbedBuilder()
            .setColor(getStateColor(state))
            .setTitle(`🎮 ${getGameName(game)} Livestream Codes`)
            .setDescription(`**State:** ${getStateName(state)}`)
            .setTimestamp();

        // Add version info
        if (tracking.version) {
            embed.addFields({
                name: '📦 Version',
                value: tracking.version,
                inline: true
            });
        }

        // Add stream time info
        if (tracking.streamTime && tracking.streamTime > 0) {
            embed.addFields({
                name: '⏰ Stream Time',
                value: `<t:${tracking.streamTime}:F>`,
                inline: true
            });
        }

        // Add codes if found
        if (state === 5 && tracking.codes && tracking.codes.length > 0) {
            const codeList = tracking.codes.map(c => `\`${c.code}\``).join('\n');
            embed.addFields({
                name: `✅ Codes Found (${tracking.codes.length})`,
                value: codeList,
                inline: false
            });
        }

        // Add next update countdown
        const nextUpdate = Math.floor(Date.now() / 1000) + 180; // 3 minutes
        embed.setFooter({ text: `Next check: ` });

        const content = `State \`${state}\` \`${getStateName(state)}\` | Next Update <t:${nextUpdate}:R>`;

        await message.edit({ content, embeds: [embed] });
    } catch (error) {
        console.error(`[Livestream Checker] Error updating message for ${game}:`, error);
    }
}

/**
 * Get game display name
 * @param {string} game - Game identifier
 * @returns {string} Display name
 */
function getGameName(game) {
    const names = {
        'genshin': 'Genshin Impact',
        'hkrpg': 'Honkai: Star Rail',
        'nap': 'Zenless Zone Zero'
    };
    return names[game] || game;
}

/**
 * Get embed color based on state
 * @param {number} state - State number
 * @returns {string} Hex color
 */
function getStateColor(state) {
    const colors = {
        0: '#808080', // Disabled - Gray
        1: '#808080', // No Schedule - Gray
        2: '#FFA500', // Not yet live - Orange
        3: '#00FF00', // Distributed - Green
        4: '#FFFF00', // Searching - Yellow
        5: '#00FF00'  // Found - Green
    };
    return colors[state] || '#808080';
}

module.exports = {
    startLivestreamChecker,
    stopLivestreamChecker,
    checkAllGames,
    checkGame
};
