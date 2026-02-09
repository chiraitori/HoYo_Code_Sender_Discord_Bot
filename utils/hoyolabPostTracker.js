const axios = require('axios');
const LivestreamTracking = require('../models/LivestreamTracking');
const { sendAnnouncement } = require('./livestreamAnnouncement');

/**
 * Hoyolab Post Tracker
 * Auto-detects Special Program announcements from official accounts
 */

// Official account UIDs
const OFFICIAL_ACCOUNTS = {
    genshin: '1015537',
    hkrpg: '172534910',   // Honkai: Star Rail
    nap: '219270333'      // Zenless Zone Zero
};

// Check interval: 30 minutes
const CHECK_INTERVAL = 30 * 60 * 1000;

let trackerInterval = null;

/**
 * Start the post tracker
 */
function startPostTracker(client) {
    if (trackerInterval) {
        console.log('[Post Tracker] Already running');
        return;
    }

    console.log('[Post Tracker] Starting...');

    // Run immediately
    checkAllAccounts(client);

    // Then run every 30 minutes
    trackerInterval = setInterval(() => {
        checkAllAccounts(client);
    }, CHECK_INTERVAL);
}

/**
 * Stop the post tracker
 */
function stopPostTracker() {
    if (trackerInterval) {
        clearInterval(trackerInterval);
        trackerInterval = null;
        console.log('[Post Tracker] Stopped');
    }
}

/**
 * Check all official accounts for new posts
 */
async function checkAllAccounts(client) {
    console.log('[Post Tracker] Checking for new livestream announcements...');

    for (const [game, accountId] of Object.entries(OFFICIAL_ACCOUNTS)) {
        if (accountId === 'TBD') continue;

        try {
            await checkAccount(game, accountId, client);
        } catch (error) {
            console.error(`[Post Tracker] Error checking ${game}:`, error.message);
        }
    }
}

/**
 * Check a single account for Special Program posts
 */
async function checkAccount(game, accountId, client) {
    const posts = await fetchLatestPosts(accountId);

    if (!posts || posts.length === 0) {
        return;
    }

    // Look for Special Program announcement in recent posts
    for (const postData of posts.slice(0, 5)) { // Check last 5 posts
        const post = postData.post;

        if (isSpecialProgramPost(post)) {
            console.log(`[Post Tracker] 🎉 Found Special Program post for ${game}!`);
            console.log(`   Post ID: ${post.post_id}`);
            console.log(`   Title: ${post.subject}`);

            // Get full post details
            const fullPost = await fetchPostDetail(post.post_id);

            // Parse stream info
            const streamInfo = parseStreamInfo(fullPost, game);

            if (streamInfo) {
                await updateTracking(streamInfo, client);
            }

            break; // Only process the most recent Special Program post
        }
    }
}

/**
 * Fetch latest posts from an account
 */
async function fetchLatestPosts(accountId) {
    const url = `https://bbs-api-os.hoyolab.com/community/post/wapi/userPost?uid=${accountId}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                'x-rpc-client_type': '4'
            },
            timeout: 10000
        });

        if (response.data.retcode === 0) {
            return response.data.data.list || [];
        }

        return null;
    } catch (error) {
        console.error(`[Post Tracker] Error fetching posts:`, error.message);
        return null;
    }
}

/**
 * Fetch full post details
 */
async function fetchPostDetail(postId) {
    const url = `https://bbs-api-os.hoyolab.com/community/post/wapi/getPostFull?post_id=${postId}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                'x-rpc-client_type': '4'
            },
            timeout: 10000
        });

        if (response.data.retcode === 0) {
            // API structure: data.post has cover_list/image_list, data.post.post has other fields
            const postWrapper = response.data.data.post;
            const postData = postWrapper.post;

            // Merge to get complete post object
            return {
                ...postData,
                cover_list: postWrapper.cover_list,
                image_list: postWrapper.image_list
            };
        }

        return null;
    } catch (error) {
        console.error(`[Post Tracker] Error fetching post detail:`, error.message);
        return null;
    }
}

/**
 * Check if a post is a Special Program announcement
 */
function isSpecialProgramPost(post) {
    if (!post || !post.subject) return false;

    const subject = post.subject.toLowerCase();
    const content = post.content ? post.content.toLowerCase() : '';

    // Keywords that indicate Special Program
    const keywords = [
        'special program',
        'livestream',
        'redemption code'
    ];

    // Check for version number pattern
    const hasVersion = /version\s+["\"]?[\w\s]+["\"]?/i.test(post.subject);

    // Must have "special program" or similar + mention redemption codes
    const hasKeywords = keywords.some(kw => subject.includes(kw) || content.includes(kw));

    return hasVersion && hasKeywords;
}

/**
 * Parse stream information from post
 */
function parseStreamInfo(post, game) {
    if (!post) return null;

    try {
        // Extract version from title
        // Genshin format: Version "Luna IV"
        // ZZZ/HSR format: Version 2.5 "Subtitle" or just Version 2.5
        let version = null;

        // Try numeric version first (e.g., "2.5", "1.4")
        const numericMatch = post.subject.match(/version\s+(\d+\.\d+)/i);
        if (numericMatch) {
            version = numericMatch[1];
        } else {
            // Try quoted version (e.g., "Luna IV")
            const quotedMatch = post.subject.match(/[\"\"']([^\"\"']+)[\"\"']/);
            if (quotedMatch) {
                version = quotedMatch[1];
            }
        }

        // Extract timestamp from desc field
        // Genshin format: "01/02/2026 at 00:00 (UTC-5)"
        const contentText = post.desc || post.content || '';
        const timestampMatch = contentText.match(/(\d{2}\/\d{2}\/\d{4})\s+at\s+(\d{2}:\d{2})\s+\(UTC([-+]?\d+)\)/);

        let streamTime = null;
        if (timestampMatch) {
            const [, date, time, utcOffset] = timestampMatch;
            const [month, day, year] = date.split('/');
            const [hour, minute] = time.split(':');

            // Create date in UTC then adjust for offset
            const utc = Date.UTC(year, month - 1, day, hour, minute);
            const offset = parseInt(utcOffset) * 60 * 60 * 1000;
            streamTime = Math.floor((utc - offset) / 1000); // Unix timestamp
        }

        // Fallback: Use post's created_at for ZZZ/HSR (they post "Intel Report" after live)
        if (!streamTime && post.created_at) {
            streamTime = post.created_at;
            console.log(`[Post Tracker] Using created_at as stream time for ${game}`);
        }

        // Get banner image - try cover_list first, then image_list
        let bannerUrl = null;
        if (post.cover_list && post.cover_list[0]) {
            bannerUrl = post.cover_list[0].url;
        } else if (post.image_list && post.image_list[0]) {
            bannerUrl = post.image_list[0].url;
        }

        if (!version) {
            console.log('[Post Tracker] Could not extract version');
            return null;
        }

        // For ZZZ/HSR Intel Reports, we may not have stream time - that's ok, we still track
        if (!streamTime) {
            console.log('[Post Tracker] No stream time found, using current time');
            streamTime = Math.floor(Date.now() / 1000);
        }

        return {
            game,
            version,
            streamTime,
            bannerUrl,
            postId: post.post_id
        };

    } catch (error) {
        console.error('[Post Tracker] Error parsing stream info:', error.message);
        return null;
    }
}

/**
 * Fetch Events Overview banner for better visuals
 * Special Program posts have simple banners, Events posts have better art
 */
async function fetchEventsBanner(accountId, game) {
    try {
        const posts = await fetchLatestPosts(accountId);
        if (!posts) return null;

        // Look for "Events Overview" or "Event Preview" post (usually 2-3 posts after Special Program)
        for (const postData of posts.slice(0, 10)) {
            const post = postData.post;
            const title = post.subject.toLowerCase();

            // Check if it's an Events Overview post
            if (title.includes('event') && (title.includes('overview') || title.includes('review'))) {
                // Fetch full post to get banner
                const fullPost = await fetchPostDetail(post.post_id);

                if (fullPost && (fullPost.cover_list?.[0] || fullPost.image_list?.[0])) {
                    const bannerUrl = fullPost.cover_list?.[0]?.url || fullPost.image_list?.[0]?.url;
                    console.log(`[Post Tracker] 🎨 Found Events Overview banner for ${game}`);
                    return bannerUrl;
                }
            }
        }

        return null;
    } catch (error) {
        console.error('[Post Tracker] Error fetching events banner:', error.message);
        return null;
    }
}

/**
 * Update LivestreamTracking database
 */
async function updateTracking(streamInfo, client) {
    const { game, version, streamTime, bannerUrl, postId } = streamInfo;

    try {
        // Check if already exists
        const existing = await LivestreamTracking.findOne({ game, version });

        if (existing) {
            console.log(`[Post Tracker] Tracking already exists for ${game} ${version}`);
            return;
        }

        // Create new tracking entry with Special Program banner
        // (Events Overview banner will be fetched later during distribution)
        await LivestreamTracking.create({
            game,
            version,
            streamTime,
            state: 2, // Not yet live
            found: false,
            distributed: false,
            codes: [],
            postId,
            bannerUrl, // Special Program banner
            autoSetup: true
        });

        console.log(`[Post Tracker] ✅ Created tracking for ${game} ${version}`);
        console.log(`   Stream time: ${new Date(streamTime * 1000).toISOString()}`);
        console.log(`   Banner: ${bannerUrl ? 'Special Program' : 'No'}`);

        // Send announcement to all guilds with Special Program banner
        if (client && bannerUrl) {
            console.log(`[Post Tracker] 📢 Sending announcement...`);
            await sendAnnouncement(client, {
                game,
                version,
                streamTime,
                bannerUrl
            });
        }

    } catch (error) {
        console.error('[Post Tracker] Error updating tracking:', error.message);
    }
}

module.exports = {
    startPostTracker,
    stopPostTracker,
    checkAllAccounts,
    isSpecialProgramPost,
    parseStreamInfo
};
