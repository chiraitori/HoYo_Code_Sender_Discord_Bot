const axios = require('axios');

const OFFICIAL_CHANNELS = {
    genshin: [
        { locale: 'en', channelId: 'UCiS882YPwZt1NfaM0gR0D9Q' },
        { locale: 'ja', handle: 'Genshin_JP' }
    ],
    hkrpg: [
        { locale: 'en', channelId: 'UC2PeMPA8PAOp-bynLoCeMLA' },
        { locale: 'ja', channelId: 'UCrzCIt5o0X88G9bCdrdbv6g' }
    ],
    nap: [
        { locale: 'en', channelId: 'UC2SpC8rL9LaeQriE4YNdyzA' },
        { locale: 'ja', handle: 'ZZZ_JP' }
    ]
};

const SPECIAL_PROGRAM_PATTERN = /\b(special program|version preview|preview program|livestream)\b|予告番組|特別番組|公式生放送/i;
const VERSION_PATTERN = /\bversion\s+["']?([a-z0-9]+(?:\.[a-z0-9]+)?(?:\s+[ivx]+)?)["']?|\bver\.?\s*(\d+\.\d+)|バージョン\s*(\d+\.\d+)/i;
const channelIdCache = new Map();
const livestreamCache = new Map();
const premiereDetailsCache = new Map();
const LIVESTREAM_CACHE_DURATION = 10 * 60 * 1000;
const PREMIERE_ACTIVE_CACHE_TTL_MS = 15 * 60 * 1000;
const PREMIERE_COMPLETED_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const OLD_VIDEO_COMPLETED_AGE_MS = 48 * 60 * 60 * 1000;
const RATE_LIMIT_COOLDOWN_MS = 30 * 60 * 1000;
const MAX_PREMIERE_CACHE_SIZE = 200;

let youtubeHtmlRateLimitUntil = 0;

function isYoutubeHtmlRateLimited(now = Date.now()) {
    return now < youtubeHtmlRateLimitUntil;
}

function recordYoutubeRateLimit(error, contextLabel) {
    if (error?.response?.status === 429) {
        const wasLimited = isYoutubeHtmlRateLimited();
        youtubeHtmlRateLimitUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
        if (!wasLimited) {
            console.warn(
                `[YouTube Tracker] Rate limited (429) during ${contextLabel}; `
                + `pausing HTML scrapes for ${Math.round(RATE_LIMIT_COOLDOWN_MS / 60000)}m`
            );
        }
        return true;
    }
    return false;
}

function setPremiereCache(videoId, data, ttlMs) {
    if (premiereDetailsCache.size >= MAX_PREMIERE_CACHE_SIZE && !premiereDetailsCache.has(videoId)) {
        const oldestKey = premiereDetailsCache.keys().next().value;
        if (oldestKey !== undefined) {
            premiereDetailsCache.delete(oldestKey);
        }
    }
    premiereDetailsCache.set(videoId, {
        data,
        expiresAt: Date.now() + ttlMs
    });
}

function decodeXml(value = '') {
    return value
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

function getTagValue(xml, tag) {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    return match ? decodeXml(match[1].trim()) : null;
}

function parseYoutubeFeed(xml) {
    const entries = [];
    const entryPattern = /<entry>([\s\S]*?)<\/entry>/gi;
    let match;

    while ((match = entryPattern.exec(xml)) !== null) {
        const entry = match[1];
        const videoId = getTagValue(entry, 'yt:videoId');
        const title = getTagValue(entry, 'title');

        if (!videoId || !title) {
            continue;
        }

        entries.push({
            videoId,
            title,
            publishedAt: getTagValue(entry, 'published'),
            updatedAt: getTagValue(entry, 'updated'),
            url: `https://www.youtube.com/watch?v=${videoId}`
        });
    }

    return entries;
}

function isSpecialProgramVideo(video) {
    return SPECIAL_PROGRAM_PATTERN.test(video.title) && VERSION_PATTERN.test(video.title);
}

function getVideoStatus(item) {
    if (item.snippet?.liveBroadcastContent === 'live') {
        return 'live';
    }
    if (item.snippet?.liveBroadcastContent === 'upcoming') {
        return 'upcoming';
    }
    if (item.liveStreamingDetails?.actualEndTime) {
        return 'completed';
    }
    return 'unknown';
}

function isOldArchiveVideo(video, now = Date.now()) {
    if (!video?.publishedAt) {
        return false;
    }
    const publishedMs = new Date(video.publishedAt).getTime();
    return Number.isFinite(publishedMs) && (now - publishedMs) > OLD_VIDEO_COMPLETED_AGE_MS;
}

async function fetchChannelLivePage(channelId) {
    if (isYoutubeHtmlRateLimited()) {
        return null;
    }

    try {
        const response = await axios.get(`https://www.youtube.com/channel/${channelId}/live`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000,
            maxRedirects: 5
        });
        const html = String(response.data);
        const canonicalUrl = html.match(
            /<link rel="canonical" href="(https:\/\/www\.youtube\.com\/watch\?v=[^"]+)"/i
        )?.[1];

        if (!canonicalUrl) {
            return null;
        }

        const startTimestamp = html.match(/"startTimestamp":"([^"]+)"/)?.[1] || null;

        return {
            url: decodeXml(canonicalUrl),
            status: html.includes('"isLiveNow":true') ? 'live' : 'upcoming',
            scheduledStartTime: startTimestamp
        };
    } catch (error) {
        if (!recordYoutubeRateLimit(error, `channel live lookup (${channelId})`)) {
            console.error('[YouTube Tracker] Channel live page lookup failed:', error.message);
        }
        return null;
    }
}

async function fetchPremiereDetails(video) {
    // Already enriched by YouTube Data API (status known) — no HTML scrape needed.
    if (video?.status && video.status !== 'unknown') {
        return video;
    }

    // Old archive videos published > 48h ago are already completed; avoid useless HTML scraping
    // that triggers YouTube 429 rate limits from VPS IPs.
    if (isOldArchiveVideo(video)) {
        return {
            ...video,
            status: 'completed'
        };
    }

    const cached = video?.videoId ? premiereDetailsCache.get(video.videoId) : null;
    if (cached && cached.expiresAt > Date.now()) {
        return {
            ...video,
            ...cached.data
        };
    }

    if (isYoutubeHtmlRateLimited()) {
        return video;
    }

    try {
        const response = await axios.get(video.url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        const html = String(response.data);
        const startTimestamp = html.match(/"startTimestamp":"([^"]+)"/)?.[1] || null;
        const scheduledStartSeconds = html.match(
            /"scheduledStartTime":"?([0-9]+)"?/
        )?.[1];
        const thumbnailUrl = html.match(
            /<meta property="og:image" content="([^"]+)"/i
        )?.[1] || null;

        let status = 'unknown';
        if (html.includes('"isLiveNow":true')) {
            status = 'live';
        } else if (html.includes('"isUpcoming":true')) {
            status = 'upcoming';
        } else if (html.includes('"isLiveContent":true')) {
            status = 'completed';
        }

        const scheduledStartTime = startTimestamp
            || (scheduledStartSeconds
                ? new Date(Number(scheduledStartSeconds) * 1000).toISOString()
                : null);
        const scheduledTime = scheduledStartTime
            ? new Date(scheduledStartTime).getTime()
            : NaN;

        if (
            status === 'unknown'
            && Number.isFinite(scheduledTime)
            && scheduledTime < Date.now() - 2 * 60 * 60 * 1000
        ) {
            status = 'completed';
        }

        const details = {
            status,
            scheduledStartTime,
            thumbnailUrl
        };

        if (video?.videoId) {
            const ttlMs = status === 'completed'
                ? PREMIERE_COMPLETED_CACHE_TTL_MS
                : PREMIERE_ACTIVE_CACHE_TTL_MS;
            setPremiereCache(video.videoId, details, ttlMs);
        }

        return {
            ...video,
            ...details
        };
    } catch (error) {
        if (!recordYoutubeRateLimit(error, `premiere lookup (${video.videoId})`)) {
            console.error(`[YouTube Tracker] Premiere lookup failed for ${video.videoId}:`, error.message);
        }
        return video;
    }
}

async function resolveChannelId(channel) {
    if (channel.channelId) {
        return channel.channelId;
    }

    if (!channel.handle) {
        return null;
    }

    if (channelIdCache.has(channel.handle)) {
        return channelIdCache.get(channel.handle);
    }

    if (isYoutubeHtmlRateLimited()) {
        return null;
    }

    try {
        const response = await axios.get(`https://www.youtube.com/@${channel.handle}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        const html = String(response.data);
        const channelId = html.match(/"externalId":"(UC[^"]+)"/)?.[1]
            || html.match(/"channelId":"(UC[^"]+)"/)?.[1]
            || null;

        if (channelId) {
            channelIdCache.set(channel.handle, channelId);
        }

        return channelId;
    } catch (error) {
        if (!recordYoutubeRateLimit(error, `handle lookup (@${channel.handle})`)) {
            console.error(`[YouTube Tracker] Could not resolve @${channel.handle}:`, error.message);
        }
        return null;
    }
}

async function enrichWithYoutubeApi(entries) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey || entries.length === 0) {
        return entries;
    }

    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                key: apiKey,
                part: 'snippet,liveStreamingDetails',
                id: entries.map(entry => entry.videoId).join(',')
            },
            timeout: 10000
        });

        const detailsById = new Map(
            (response.data?.items || []).map(item => [item.id, item])
        );

        return entries.map(entry => {
            const details = detailsById.get(entry.videoId);
            if (!details) {
                return entry;
            }

            return {
                ...entry,
                title: details.snippet?.title || entry.title,
                status: getVideoStatus(details),
                scheduledStartTime: details.liveStreamingDetails?.scheduledStartTime || null,
                actualStartTime: details.liveStreamingDetails?.actualStartTime || null,
                thumbnailUrl: details.snippet?.thumbnails?.maxres?.url
                    || details.snippet?.thumbnails?.high?.url
                    || null
            };
        });
    } catch (error) {
        console.error('[YouTube Tracker] API lookup failed, using RSS data:', error.message);
        return entries;
    }
}

async function fetchChannelLivestreamOutcome(channel) {
    const channelId = await resolveChannelId(channel);
    if (!channelId) {
        return { ok: false, stream: null };
    }

    try {
        const response = await axios.get(
            `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
            {
                headers: { 'User-Agent': 'HoYo-Code-Sender-Bot/1.0' },
                timeout: 10000
            }
        );

        const entries = parseYoutubeFeed(String(response.data));
        const enrichedEntries = await enrichWithYoutubeApi(entries);
        const candidates = await Promise.all(
            enrichedEntries.filter(isSpecialProgramVideo).slice(0, 2).map(fetchPremiereDetails)
        );

        if (candidates.length === 0) {
            return { ok: true, stream: null };
        }

        // Only query /channel/:id/live if at least one candidate is not already completed.
        const hasPendingCandidate = candidates.some(video => video.status !== 'completed');
        const channelLive = hasPendingCandidate
            ? await fetchChannelLivePage(channelId)
            : null;
        const candidate = candidates.find(video => {
            if (!channelLive?.url) {
                return false;
            }
            return channelLive.url.includes(video.videoId);
        }) || candidates.find(video => video.status === 'live')
            || candidates.find(video => video.status === 'upcoming')
            || candidates[0];

        const channelLiveMatchesCandidate = Boolean(
            channelLive?.url && candidate.videoId && channelLive.url.includes(candidate.videoId)
        );

        if (!channelLiveMatchesCandidate || candidate.status !== 'unknown') {
            return {
                ok: true,
                stream: {
                    ...candidate,
                    locale: channel.locale,
                    channelId,
                    status: candidate.status || 'unknown'
                }
            };
        }

        return {
            ok: true,
            stream: {
                ...candidate,
                ...channelLive,
                locale: channel.locale,
                channelId,
                videoId: channelLive.url.match(/[?&]v=([^&]+)/)?.[1] || candidate.videoId,
                scheduledStartTime: channelLive.scheduledStartTime
                    || candidate.scheduledStartTime
                    || null
            }
        };
    } catch (error) {
        console.error(`[YouTube Tracker] Error checking ${channel.locale}:`, error.message);
        return { ok: false, stream: null };
    }
}

async function fetchChannelLivestream(channel) {
    const outcome = await fetchChannelLivestreamOutcome(channel);
    return outcome.stream;
}

async function fetchYoutubeLivestreams(game) {
    const cached = livestreamCache.get(game);
    if (cached && Date.now() - cached.timestamp < LIVESTREAM_CACHE_DURATION) {
        return cached.streams;
    }

    const channels = OFFICIAL_CHANNELS[game] || [];
    const outcomes = await Promise.all(channels.map(fetchChannelLivestreamOutcome));
    const anySucceeded = outcomes.some(outcome => outcome.ok);
    const streams = outcomes.map(outcome => outcome.stream).filter(Boolean);

    if (!anySucceeded && channels.length > 0) {
        // Do not overwrite good cached data or negative-cache transient YouTube outages.
        return cached?.streams || [];
    }

    livestreamCache.set(game, { streams, timestamp: Date.now() });
    return streams;
}

function clearYoutubeCache() {
    livestreamCache.clear();
    channelIdCache.clear();
    premiereDetailsCache.clear();
    youtubeHtmlRateLimitUntil = 0;
}

async function getOfficialChannelLinks(game) {
    const channels = OFFICIAL_CHANNELS[game] || [];
    const resolved = await Promise.all(channels.map(async channel => {
        const channelId = await resolveChannelId(channel);
        if (!channelId) {
            return null;
        }

        return {
            locale: channel.locale,
            channelId,
            url: `https://www.youtube.com/channel/${channelId}/live`,
            status: 'unknown'
        };
    }));

    return resolved.filter(Boolean);
}

async function fetchYoutubeLivestream(game) {
    const streams = await fetchYoutubeLivestreams(game);
    return streams.find(stream => stream.locale === 'en') || streams[0] || null;
}

module.exports = {
    OFFICIAL_CHANNELS,
    clearYoutubeCache,
    decodeXml,
    fetchChannelLivestream,
    fetchChannelLivePage,
    fetchPremiereDetails,
    fetchYoutubeLivestreams,
    fetchYoutubeLivestream,
    getOfficialChannelLinks,
    isOldArchiveVideo,
    isSpecialProgramVideo,
    isYoutubeHtmlRateLimited,
    parseYoutubeFeed,
    resolveChannelId
};
