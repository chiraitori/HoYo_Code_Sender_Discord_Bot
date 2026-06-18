const axios = require('axios');
const LivestreamTracking = require('../models/LivestreamTracking');
const { sendAnnouncement } = require('./livestreamAnnouncement');
const {
    fetchYoutubeLivestreams,
    getOfficialChannelLinks
} = require('./youtubeLivestreamTracker');

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

// Check interval: 10 minutes
const CHECK_INTERVAL = 10 * 60 * 1000;

let trackerInterval = null;
let trackerRunning = false;

/**
 * Start the post tracker
 */
async function startPostTracker(client) {
    if (trackerInterval) {
        console.log('[Post Tracker] Already running');
        return;
    }

    console.log('[Post Tracker] Starting...');

    // Run immediately
    await checkAllAccounts(client);

    // Then run every 30 minutes
    trackerInterval = setInterval(() => {
        checkAllAccounts(client).catch(error => {
            console.error('[Post Tracker] Scheduled check failed:', error.message);
        });
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
    if (trackerRunning) {
        console.log('[Post Tracker] Skipping because the previous check is still active');
        return;
    }

    trackerRunning = true;
    console.log('[Post Tracker] Checking for new livestream announcements...');

    try {
        const tasks = Object.entries(OFFICIAL_ACCOUNTS)
            .filter(([, accountId]) => accountId !== 'TBD')
            .map(async ([game, accountId]) => {
                try {
                    await checkAccount(game, accountId, client);
                } catch (error) {
                    console.error(`[Post Tracker] Error checking ${game}:`, error.message);
                }
            });

        await Promise.all(tasks);
    } finally {
        trackerRunning = false;
    }
}

/**
 * Check a single account for Special Program posts
 */
async function checkAccount(game, accountId, client) {
    const [posts, youtubeStreams, officialYoutubeChannels] = await Promise.all([
        fetchLatestPosts(accountId),
        fetchYoutubeLivestreams(game),
        getOfficialChannelLinks(game)
    ]);

    if ((!posts || posts.length === 0) && youtubeStreams.length === 0) {
        return;
    }

    // Look for Special Program announcement in recent posts
    let streamInfo = null;
    for (const postData of (posts || []).slice(0, 20)) {
        const post = postData.post;

        if (isSpecialProgramPost(post)) {
            console.log(`[Post Tracker] 🎉 Found Special Program post for ${game}!`);
            console.log(`   Post ID: ${post.post_id}`);
            console.log(`   Title: ${post.subject}`);

            // Get full post details
            const fullPost = await fetchPostDetail(post.post_id);

            // Parse stream info
            streamInfo = parseStreamInfo(fullPost, game);

            break; // Only process the most recent Special Program post
        }
    }

    if (youtubeStreams.length > 0) {
        const versionGroups = new Map();
        for (const youtubeStream of youtubeStreams) {
            const version = extractVersion(youtubeStream.title);
            if (!version) continue;
            if (!versionGroups.has(version)) versionGroups.set(version, []);
            versionGroups.get(version).push(youtubeStream);
        }

        let youtubeVersion = streamInfo?.version;
        let matchingStreams = youtubeVersion ? versionGroups.get(youtubeVersion) || [] : [];

        if (matchingStreams.length === 0 && versionGroups.size > 0) {
            [youtubeVersion, matchingStreams] = versionGroups.entries().next().value;
        }

        const primaryStream = matchingStreams.find(stream => stream.locale === 'en')
            || matchingStreams[0];
        const youtubeTime = primaryStream?.scheduledStartTime
            || primaryStream?.actualStartTime
            || primaryStream?.publishedAt;

        if (youtubeVersion && primaryStream && (!streamInfo || youtubeVersion !== streamInfo.version)) {
            streamInfo = {
                game,
                version: youtubeVersion,
                streamTime: youtubeTime
                    ? Math.floor(new Date(youtubeTime).getTime() / 1000)
                    : Math.floor(Date.now() / 1000),
                streamTimeEstimated: !primaryStream.scheduledStartTime,
                bannerUrl: primaryStream.thumbnailUrl || null,
                postId: null,
                source: 'youtube'
            };
        }

        if (streamInfo && primaryStream && youtubeVersion === streamInfo.version) {
            streamInfo.youtubeStreams = officialYoutubeChannels.map(channel => {
                const stream = matchingStreams.find(item => item.locale === channel.locale);
                return {
                    locale: channel.locale,
                    channelId: channel.channelId,
                    videoId: stream?.videoId || null,
                    url: stream?.url || channel.url,
                    title: stream?.title || null,
                    status: stream?.status || 'unknown',
                    scheduledStartTime: stream?.scheduledStartTime || null
                };
            });
            streamInfo.youtubeVideoId = primaryStream.videoId;
            streamInfo.youtubeUrl = primaryStream.url;
            streamInfo.youtubeStatus = primaryStream.status || 'unknown';
            streamInfo.source = streamInfo.source === 'youtube' ? 'youtube' : 'hoyolab+youtube';

            if (primaryStream.scheduledStartTime || primaryStream.actualStartTime) {
                streamInfo.streamTime = Math.floor(new Date(
                    primaryStream.scheduledStartTime || primaryStream.actualStartTime
                ).getTime() / 1000);
                streamInfo.streamTimeEstimated = false;
            }
        }
    }

    if (streamInfo && !streamInfo.youtubeStreams?.length) {
        streamInfo.youtubeStreams = officialYoutubeChannels;
    }

    if (streamInfo) {
        await updateTracking(streamInfo, client);
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

function extractVersion(subject = '') {
    const numericMatch = subject.match(/version\s+(\d+\.\d+)/i);
    if (numericMatch) {
        return numericMatch[1];
    }

    const quotedMatch = subject.match(/version\s+["']([^"']+)["']/i);
    if (quotedMatch) {
        return quotedMatch[1];
    }

    const shortMatch = subject.match(/\bver\.?\s*(\d+\.\d+)/i);
    if (shortMatch) {
        return shortMatch[1];
    }

    const japaneseMatch = subject.match(/バージョン\s*(\d+\.\d+)/i);
    return japaneseMatch ? japaneseMatch[1] : null;
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
        const version = extractVersion(post.subject);

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

        // Countdown posts are commonly published shortly before the stream.
        const countdownMatch = post.subject.match(
            /countdown:\s*(\d+)\s*(hour|hours|minute|minutes)\s+left/i
        );
        if (!streamTime && countdownMatch && post.created_at) {
            const amount = Number(countdownMatch[1]);
            const seconds = countdownMatch[2].toLowerCase().startsWith('hour')
                ? amount * 60 * 60
                : amount * 60;
            streamTime = post.created_at + seconds;
        }

        // Fallback: use the post time when no explicit schedule is available.
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
            streamTimeEstimated: !timestampMatch && !countdownMatch,
            bannerUrl,
            postId: post.post_id,
            source: 'hoyolab'
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
    const {
        game,
        version,
        streamTime,
        streamTimeEstimated = false,
        bannerUrl,
        postId,
        source = 'hoyolab',
        youtubeVideoId = null,
        youtubeUrl = null,
        youtubeStatus = 'unknown',
        youtubeStreams = []
    } = streamInfo;

    try {
        const existing = await LivestreamTracking.findOne({ game, version });
        const shouldPreserveExistingTime = existing
            && existing.streamTime
            && existing.streamTimeEstimated === false
            && streamTimeEstimated === true;
        const finalStreamTime = shouldPreserveExistingTime
            ? existing.streamTime
            : streamTime;
        const finalStreamTimeEstimated = shouldPreserveExistingTime
            ? false
            : streamTimeEstimated;
        const tracking = await LivestreamTracking.findOneAndUpdate(
            { game, version },
            {
                $set: {
                    streamTime: finalStreamTime,
                    streamTimeEstimated: finalStreamTimeEstimated,
                    source,
                    ...(postId ? { postId } : {}),
                    ...(bannerUrl ? { bannerUrl } : {}),
                    ...(youtubeVideoId ? { youtubeVideoId } : {}),
                    ...(youtubeUrl ? { youtubeUrl } : {}),
                    youtubeStatus,
                    youtubeStreams
                },
                $setOnInsert: {
                    found: false,
                    distributed: false,
                    codes: [],
                    announcementSent: false
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log(`[Post Tracker] ✅ Tracking ready for ${game} ${version}`);
        console.log(`   Stream time: ${new Date(finalStreamTime * 1000).toISOString()}`);
        console.log(`   Sources: ${source}`);

        const currentTime = Math.floor(Date.now() / 1000);
        const shouldAnnounce = client
            && !tracking.announcementSent
            && finalStreamTime > currentTime + 5 * 60;

        if (shouldAnnounce) {
            console.log(`[Post Tracker] 📢 Sending announcement...`);
            await sendAnnouncement(client, {
                ...streamInfo,
                streamTime: finalStreamTime,
                streamTimeEstimated: finalStreamTimeEstimated
            });
            tracking.announcementSent = true;
            await tracking.save();
        } else if (!existing) {
            console.log('[Post Tracker] Announcement skipped because the stream already started');
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
    parseStreamInfo,
    extractVersion,
    updateTracking
};
