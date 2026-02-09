const axios = require('axios');
const LivestreamTracking = require('../models/LivestreamTracking');
const { parseIconBonuses } = require('./rewardIconParser');

/**
 * Hoyolab API Client for Livestream Codes
 * Fetches redemption codes from Hoyolab livestream API
 */

// Game ID mapping for Hoyolab API
const GAME_IDS = {
    'genshin': '2',
    'hkrpg': '6',
    'nap': '8'
};

// State names for display
const STATE_NAMES = {
    0: 'Disabled',
    1: 'No Schedule',
    2: 'Not yet live',
    3: 'Distributed',
    4: 'Searching',
    5: 'Found'
};

/**
 * Get current state for a game
 * @param {string} game - Game identifier (genshin/hkrpg/nap)
 * @param {string} version - Game version
 * @returns {Promise<number>} State (0-5)
 */
async function getState(game, version) {
    const tracking = await LivestreamTracking.findOne({ game, version });

    if (!tracking) {
        return 1; // No Schedule
    }

    // CHECK 1: Game disabled?
    if (tracking.disabled) {
        return 0; // Disabled
    }

    // CHECK 2: Has schedule?
    if (tracking.streamTime === 0) {
        return 1; // No Schedule
    }

    // CHECK 3: Stream started?
    const currentTime = Math.floor(Date.now() / 1000);
    if (tracking.streamTime > currentTime) {
        return 2; // Not yet live
    }

    // CHECK 4: Already distributed?
    if (tracking.distributed) {
        return 3; // Distributed
    }

    // CHECK 5: Found all codes?
    if (tracking.found) {
        return 5; // Found
    }

    // Default: Searching
    return 4; // Searching
}

/**
 * Fetch livestream codes from Hoyolab API
 * @param {string} game - Game identifier
 * @returns {Promise<Object|null>} API response or null on error
 */
async function fetchLivestreamCodes(game) {
    const gameId = GAME_IDS[game];
    if (!gameId) {
        console.error(`[Hoyolab API] Invalid game: ${game}`);
        return null;
    }

    const url = `https://bbs-api-os.hoyolab.com/community/painter/wapi/circle/channel/guide/material?game_id=${gameId}`;

    try {
        // Headers optimized for Hoyolab API
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.hoyolab.com/',
                'Origin': 'https://www.hoyolab.com',
                'x-rpc-client_type': '4'
            },
            timeout: 10000
        });

        return response.data;
    } catch (error) {
        console.error(`[Hoyolab API] Error fetching codes for ${game}:`, error.message);
        return null;
    }
}

/**
 * Parse API response and extract codes
 * Improved parser based on seriaati/hoyo-codes logic
 * Checks ALL modules with exchange_group, not just module_type 7
 * @param {Object} responseData - API response
 * @param {string} game - Game identifier
 * @param {string} version - Game version
 * @returns {Promise<boolean>} True if codes found
 */
async function parseAndSaveCodes(responseData, game, version) {
    if (!responseData || !responseData.data || !responseData.data.modules) {
        console.log(`[Hoyolab API] Invalid response structure for ${game}`);
        return false;
    }

    const modules = responseData.data.modules;
    console.log(`[Hoyolab API] Found ${modules.length} modules for ${game}`);

    // STEP 1: Parse codes from ALL modules with exchange_group (improved logic)
    const codes = [];
    let expectedCount = 3; // Default

    for (const module of modules) {
        // Check if module has exchange_group with bonuses
        if (module.exchange_group && module.exchange_group.bonuses) {
            const bonuses = module.exchange_group.bonuses;

            // Get expected count if available
            if (module.exchange_group.bonuses_summary?.code_count) {
                expectedCount = module.exchange_group.bonuses_summary.code_count;
            }

            console.log(`[Hoyolab API] Module type ${module.module_type || 'unknown'}: ${bonuses.length} bonuses`);

            // Extract codes from this module
            for (const bonus of bonuses) {
                if (bonus.exchange_code) {
                    const code = bonus.exchange_code.trim().toUpperCase();

                    // Avoid duplicates
                    if (!codes.some(c => c.code === code)) {
                        // Parse icon bonuses to get readable reward description
                        const rewardText = parseIconBonuses(bonus.icon_bonuses, game);

                        codes.push({
                            code: code,
                            title: rewardText,
                            expireAt: bonus.offline_at || 0,
                            discoveredAt: Math.floor(Date.now() / 1000)
                        });
                    }
                }
            }
        }
    }

    console.log(`[Hoyolab API] Found ${codes.length} codes for ${game} v${version}`);

    if (codes.length === 0) {
        console.log(`[Hoyolab API] No codes available for ${game} - no active livestream`);
        return false;
    }

    // STEP 2: Save to database
    const tracking = await LivestreamTracking.findOneAndUpdate(
        { game, version },
        {
            codes: codes,
            lastChecked: new Date(),
            found: codes.length > 0
        },
        { upsert: true, new: true }
    );

    // Return true if we found any codes
    return codes.length > 0;
}

/**
 * Get state name from state number
 * @param {number} state - State number (0-5)
 * @returns {string} State name
 */
function getStateName(state) {
    return STATE_NAMES[state] || 'Unknown';
}

module.exports = {
    getState,
    fetchLivestreamCodes,
    parseAndSaveCodes,
    getStateName,
    STATE_NAMES
};
