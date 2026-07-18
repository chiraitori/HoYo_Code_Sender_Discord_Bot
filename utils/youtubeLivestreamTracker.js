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
const LIVESTREAM_CACHE_DURATION = 5 * 60 * 1000;

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

async function fetchChannelLivePage(channelId) {
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
        console.error('[YouTube Tracker] Channel live page lookup failed:', error.message);
        return null;
    }
}

async function fetchPremiereDetails(video) {
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

        return {
            ...video,
            status,
            scheduledStartTime,
            thumbnailUrl
        };
    } catch (error) {
        console.error(`[YouTube Tracker] Premiere lookup failed for ${video.videoId}:`, error.message);
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
        console.error(`[YouTube Tracker] Could not resolve @${channel.handle}:`, error.message);
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

async function fetchChannelLivestream(channel) {
    const channelId = await resolveChannelId(channel);
    if (!channelId) {
        return null;
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
            return null;
        }

        const channelLive = await fetchChannelLivePage(channelId);
        const candidate = candidates.find(video => {
            if (!channelLive?.url) {
                return false;
            }
            return channelLive.url.includes(video.videoId);
        }) || candidates.find(video => video.status === 'live')
            || candidates.find(video => video.status === 'upcoming')
            || candidates[0];

        if (!channelLive || candidate.status !== 'unknown') {
            return {
                ...candidate,
                locale: channel.locale,
                channelId,
                status: candidate.status || 'unknown'
            };
        }

        return {
            ...candidate,
            ...channelLive,
            locale: channel.locale,
            channelId,
            videoId: channelLive.url.match(/[?&]v=([^&]+)/)?.[1] || candidate.videoId,
            scheduledStartTime: channelLive.scheduledStartTime
                || candidate.scheduledStartTime
                || null
        };
    } catch (error) {
        console.error(`[YouTube Tracker] Error checking ${channel.locale}:`, error.message);
        return null;
    }
}

async function fetchYoutubeLivestreams(game) {
    const cached = livestreamCache.get(game);
    if (cached && Date.now() - cached.timestamp < LIVESTREAM_CACHE_DURATION) {
        return cached.streams;
    }

    const channels = OFFICIAL_CHANNELS[game] || [];
    const results = await Promise.all(channels.map(fetchChannelLivestream));
    const streams = results.filter(Boolean);
    livestreamCache.set(game, { streams, timestamp: Date.now() });
    return streams;
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
    decodeXml,
    fetchChannelLivePage,
    fetchPremiereDetails,
    fetchYoutubeLivestreams,
    fetchYoutubeLivestream,
    getOfficialChannelLinks,
    isSpecialProgramVideo,
    parseYoutubeFeed,
    resolveChannelId
};
