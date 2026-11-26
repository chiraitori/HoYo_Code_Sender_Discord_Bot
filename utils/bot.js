// TODO: refactor this mess before Ganyu gets disappointed
require('dotenv').config();
const { Client, Collection, REST, Routes, ActivityType, MessageFlags } = require('discord.js');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { checkAndSendNewCodes } = require('./autoCodeSend');
const { checkAndSendYearChangeMessage } = require('./yearChangeCheck');
const { setupTopggWebhook } = require('./topggWebhook');
const { auditGuildConfigurations } = require('./configAudit');
const { recoverMissingGuildConfigurations } = require('./configRecovery');
const { sendWelcomeMessage } = require('./welcome');
const authMiddleware = require('./authMiddleware');
const { createEdgeSecretMiddleware } = require('./dashboardBridge');
const {
    parseTrustProxy,
    createCorsOptions,
    securityHeadersMiddleware,
    createPublicLimiter,
    createDashboardApiLimiter,
    createServerActionLimiter,
    jsonBodyErrorHandler,
    logDashboardAudit
} = require('./httpSecurity');
const { startLivestreamChecker, stopLivestreamChecker } = require('./livestreamChecker');
const { startPostTracker, stopPostTracker } = require('./hoyolabPostTracker');
const { sendChannelMessage } = require('./discordMessageSender');
const { broadcastEvalWhenReady } = require('./clusterGuilds');
const { removeOtherGuildRecords } = require('./guildRecords');
const languageManager = require('./language');
const { getShardIdsFromEnv } = require('./shards');
const { getHoyolabExchangeCodes, mergeExchangeCodes } = require('./hoyolabExchangeCodes');
const { getDiscordIdentityError } = require('./discordIdentity');
const { reconcileAllConfiguredRoles } = require('./configuredRoles');
const {
    getValidatedLanguage, getValidatedConfigPatch,
    configPatchBelongsToGuild,
    getValidatedSettingsPatch,
    getValidatedTestPayload,
    getValidatedPostCodePayload
} = require('./dashboardInput');
const { createDiscordClientOptions } = require('./discordClientOptions');
const { createSelfMaintenance, shouldRunConfigRecovery } = require('./selfMaintenance');

// Only shard 0 runs Express, cron jobs, and other singleton services.
// When launched by ShardingManager, SHARDS env is set automatically.
// When running standalone (no ShardingManager), treat as primary.
const shardIds = getShardIdsFromEnv();
const runsPrimaryServices = shardIds.includes(0);

// Express setup
const app = express();
const PORT = process.env.PORT || 3000;
const API_BIND_HOST = process.env.API_BIND_HOST || '0.0.0.0';
let httpServer = null;
let selfMaintenance = null;
let presenceInterval = null;
let codeCheckInterval = null;
let yearCheckInterval = null;

app.disable('x-powered-by');
app.set('trust proxy', parseTrustProxy());

const publicLimiter = createPublicLimiter();
const dashboardApiLimiter = createDashboardApiLimiter();
const testNotificationLimiter = createServerActionLimiter({
    windowMs: 5 * 60 * 1000,
    max: 5,
    message: 'Too many test notifications for this server. Please wait 5 minutes.'
});
const resetConfigLimiter = createServerActionLimiter({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: 'Too many configuration reset requests for this server. Please wait 15 minutes.'
});
const edgeSecretMiddleware = createEdgeSecretMiddleware();

// Security headers, locked CORS, and bounded JSON parser with rawBody capture for HMAC verification
app.use(securityHeadersMiddleware);
app.use(cors(createCorsOptions()));
app.use(express.json({
    limit: '64kb',
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(jsonBodyErrorHandler);
app.use(express.static(path.join(__dirname, '..', 'public'))); // Serve static files from project root

// Public, non-sensitive endpoint for uptime monitors and load balancers.
app.get('/health', publicLimiter, (req, res) => {
    const snapshot = selfMaintenance?.getSnapshot();
    if (!snapshot) {
        return res.status(503).json({
            status: 'starting',
            healthy: false,
            version: process.env.VERSION || null
        });
    }

    return res.status(snapshot.healthy ? 200 : 503).json({
        ...snapshot,
        version: process.env.VERSION || null
    });
});

// Optional edge gateway secret check for VPS deployments behind Cloudflare / reverse proxy
app.use('/api', edgeSecretMiddleware);

// Public code feed rate limiting
app.use('/api/codes', publicLimiter);
app.use('/api/livestreams', publicLimiter);

// Authentication + actor-keyed rate limiting for protected dashboard -> bot API routes
app.use('/api/bot', authMiddleware, dashboardApiLimiter);
app.use('/api/server', authMiddleware, dashboardApiLimiter);

// Simple cache for API responses
const apiCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const DISCORD_SNOWFLAKE_REGEX = /^\d{17,20}$/;

function getValidatedGuildId(rawId) {
    if (typeof rawId !== 'string') {
        return null;
    }

    const normalizedId = rawId.trim();
    return DISCORD_SNOWFLAKE_REGEX.test(normalizedId) ? normalizedId : null;
}

function serializeGuild(guild, includeDetails = false) {
    const guildInfo = {
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount,
        icon: guild.iconURL({ extension: 'png', size: 128 }),
        ownerId: guild.ownerId,
        joinedAt: guild.joinedAt?.toISOString() || null
    };

    if (!includeDetails) {
        return guildInfo;
    }

    return {
        ...guildInfo,
        description: guild.description,
        features: guild.features,
        roles: guild.roles.cache
            .filter(role => role.name !== '@everyone' && !role.managed)
            .map(role => ({
                id: role.id,
                name: role.name,
                color: role.hexColor,
                position: role.position,
                mentionable: role.mentionable,
                managed: role.managed
            }))
            .sort((a, b) => b.position - a.position),
        channels: guild.channels.cache
            .filter(channel =>
                (channel.type === 0 || channel.type === 5)
                && guild.members.me
                && channel.permissionsFor(guild.members.me)?.has(['ViewChannel', 'SendMessages'])
            )
            .map(channel => ({
                id: channel.id,
                name: channel.name,
                type: channel.type,
                position: channel.position,
                canEmbed: Boolean(guild.members.me && channel.permissionsFor(guild.members.me)?.has('EmbedLinks'))
            }))
            .sort((a, b) => a.position - b.position),
        threads: guild.channels.cache
            .filter(channel =>
                (channel.type === 11 || channel.type === 12)
                && !channel.archived
                && guild.members.me
                && channel.permissionsFor(guild.members.me)?.has(['ViewChannel', 'SendMessagesInThreads'])
            )
            .map(thread => ({
                id: thread.id,
                name: thread.name,
                type: thread.type,
                parentId: thread.parentId || null,
                parentName: thread.parent?.name || null,
                canEmbed: Boolean(guild.members.me && thread.permissionsFor(guild.members.me)?.has('EmbedLinks'))
            }))
            .sort((a, b) => a.name.localeCompare(b.name))
    };
}

async function getClusterStats() {
    if (!client.shard) {
        return [{
            guildCount: client.guilds.cache.size,
            userCount: client.guilds.cache.reduce((sum, guild) => sum + guild.memberCount, 0),
            channelCount: client.channels.cache.size,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            ping: client.ws.ping,
            status: client.ws.status
        }];
    }

    return broadcastEvalWhenReady(client, shardClient => ({
        guildCount: shardClient.guilds.cache.size,
        userCount: shardClient.guilds.cache.reduce((sum, guild) => sum + guild.memberCount, 0),
        channelCount: shardClient.channels.cache.size,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        ping: shardClient.ws.ping,
        status: shardClient.ws.status
    }), { maxAttempts: 5, retryDelayMs: 500 });
}

async function getClusterGuilds() {
    if (!client.shard) {
        return client.guilds.cache.map(guild => serializeGuild(guild));
    }

    const guildsByShard = await broadcastEvalWhenReady(client, shardClient =>
        shardClient.guilds.cache.map(guild => ({
            id: guild.id,
            name: guild.name,
            memberCount: guild.memberCount,
            icon: guild.iconURL({ extension: 'png', size: 128 }),
            ownerId: guild.ownerId,
            joinedAt: guild.joinedAt?.toISOString() || null
        })),
        { maxAttempts: 5, retryDelayMs: 500 }
    );

    return guildsByShard.flat();
}

async function getGuildAcrossShards(guildId) {
    if (!client.shard) {
        const guild = client.guilds.cache.get(guildId);
        return guild ? serializeGuild(guild, true) : null;
    }

    const results = await broadcastEvalWhenReady(client, (shardClient, context) => {
        const guild = shardClient.guilds.cache.get(context.guildId);
        if (!guild) {
            return null;
        }

        return {
            id: guild.id,
            name: guild.name,
            memberCount: guild.memberCount,
            icon: guild.iconURL({ extension: 'png', size: 128 }),
            ownerId: guild.ownerId,
            joinedAt: guild.joinedAt?.toISOString() || null,
            description: guild.description,
            features: guild.features,
            roles: guild.roles.cache
                .filter(role => role.name !== '@everyone' && !role.managed)
                .map(role => ({
                    id: role.id,
                    name: role.name,
                    color: role.hexColor,
                    position: role.position,
                    mentionable: role.mentionable,
                    managed: role.managed
                }))
                .sort((a, b) => b.position - a.position),
            channels: guild.channels.cache
                .filter(channel =>
                    (channel.type === 0 || channel.type === 5)
                    && guild.members.me
                    && channel.permissionsFor(guild.members.me)?.has(['ViewChannel', 'SendMessages'])
                )
                .map(channel => ({
                    id: channel.id,
                    name: channel.name,
                    type: channel.type,
                    position: channel.position,
                    canEmbed: Boolean(guild.members.me && channel.permissionsFor(guild.members.me)?.has('EmbedLinks'))
                }))
                .sort((a, b) => a.position - b.position),
            threads: guild.channels.cache
                .filter(channel =>
                    (channel.type === 11 || channel.type === 12)
                    && !channel.archived
                    && guild.members.me
                    && channel.permissionsFor(guild.members.me)?.has(['ViewChannel', 'SendMessagesInThreads'])
                )
                .map(thread => ({
                    id: thread.id,
                    name: thread.name,
                    type: thread.type,
                    parentId: thread.parentId || null,
                    parentName: thread.parent?.name || null,
                    canEmbed: Boolean(guild.members.me && thread.permissionsFor(guild.members.me)?.has('EmbedLinks'))
                }))
                .sort((a, b) => a.name.localeCompare(b.name))
        };
    }, { context: { guildId }, maxAttempts: 5, retryDelayMs: 500 });

    return results.find(Boolean) || null;
}

// Helper function to get cached or fresh API data
async function getCachedApiData(game, apiUrl) {
    const cacheKey = `codes_${game}`;
    const cached = apiCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }

    try {
        const startTime = Date.now();
        const response = await axios.get(apiUrl, {
            timeout: 10000, // 10 second timeout
            headers: {
                'User-Agent': 'HoYo-Code-Sender-Bot/1.0'
            }
        });
        const responseTime = Date.now() - startTime;

        // Log slow API responses
        if (responseTime > 5000) {
            console.warn(`⚠️  Slow API response for ${game}: ${responseTime}ms`);
        }

        const data = (response.data && typeof response.data === 'object') ? response.data : { codes: [] };
        const hoyolabCodes = await getHoyolabExchangeCodes(game);
        data.codes = mergeExchangeCodes(game, Array.isArray(data.codes) ? data.codes : [], hoyolabCodes);
        apiCache.set(cacheKey, {
            data: data,
            timestamp: Date.now(),
            responseTime
        });

        return data;
    } catch (error) {
        // If we have cached data, return it even if expired during error
        if (cached) {
            console.warn(`API error for ${game}, using cached data:`, error.message);
            console.log(`Using stale cached data for ${game} (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`);
            return cached.data;
        }
        throw error;
    }
}

// Unified public codes endpoint (1 Vercel -> VPS round trip with ETag & SWR caching)
app.get('/api/codes', async (req, res) => {
    try {
        const [genshinRes, hsrRes, zzzRes] = await Promise.allSettled([
            getCachedApiData('genshin', 'https://hoyo-codes.seria.moe/codes?game=genshin'),
            getCachedApiData('hkrpg', 'https://hoyo-codes.seria.moe/codes?game=hkrpg'),
            getCachedApiData('nap', 'https://hoyo-codes.seria.moe/codes?game=nap')
        ]);

        const payload = {
            games: {
                genshin: genshinRes.status === 'fulfilled' ? genshinRes.value : { codes: [], error: true },
                hsr: hsrRes.status === 'fulfilled' ? hsrRes.value : { codes: [], error: true },
                zzz: zzzRes.status === 'fulfilled' ? zzzRes.value : { codes: [], error: true }
            },
            fetchedAt: new Date().toISOString()
        };

        const etag = 'W/"' + crypto.createHash('sha1').update(JSON.stringify(payload.games)).digest('hex') + '"';
        res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
        res.setHeader('ETag', etag);

        if (req.headers['if-none-match'] === etag) {
            return res.status(304).end();
        }
        return res.json(payload);
    } catch (error) {
        console.error('Error fetching unified codes:', error);
        return res.status(500).json({ error: 'Failed to fetch codes' });
    }
});

app.get('/api/codes/genshin', async (req, res) => {
    try {
        const data = await getCachedApiData('genshin', 'https://hoyo-codes.seria.moe/codes?game=genshin');
        res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
        res.json(data);
    } catch (error) {
        console.error('Error fetching Genshin codes:', error);
        res.status(500).json({ error: 'Failed to fetch codes' });
    }
});

app.get('/api/codes/hsr', async (req, res) => {
    try {
        const data = await getCachedApiData('hkrpg', 'https://hoyo-codes.seria.moe/codes?game=hkrpg');
        res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
        res.json(data);
    } catch (error) {
        console.error('Error fetching HSR codes:', error);
        res.status(500).json({ error: 'Failed to fetch codes' });
    }
});

app.get('/api/codes/zzz', async (req, res) => {
    try {
        const data = await getCachedApiData('nap', 'https://hoyo-codes.seria.moe/codes?game=nap');
        res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
        res.json(data);
    } catch (error) {
        console.error('Error fetching ZZZ codes:', error);
        res.status(500).json({ error: 'Failed to fetch codes' });
    }
});

// Public livestream tracker endpoint
app.get('/api/livestreams', async (req, res) => {
    try {
        const cached = apiCache.get('livestreams_status');
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
            return res.json(cached.data);
        }

        const LivestreamTracking = require('../models/LivestreamTracking');
        const dbToGame = { genshin: 'genshin', hkrpg: 'hsr', nap: 'zzz' };
        const latestDocs = await Promise.all(
            Object.entries(dbToGame).map(async ([dbGame, game]) => {
                const doc = await LivestreamTracking.findOne({ game: dbGame })
                    .sort({ streamTime: -1, _id: -1 })
                    .select('game version streamTime disabled found distributed source codes')
                    .maxTimeMS(3000)
                    .lean();
                if (!doc) {
                    return {
                        game,
                        version: null,
                        streamTime: 0,
                        disabled: false,
                        found: false,
                        distributed: false,
                        source: null,
                        codeCount: 0
                    };
                }
                return {
                    game,
                    version: doc.version || null,
                    streamTime: Number(doc.streamTime || 0),
                    disabled: Boolean(doc.disabled),
                    found: Boolean(doc.found),
                    distributed: Boolean(doc.distributed),
                    source: doc.source || null,
                    codeCount: Array.isArray(doc.codes) ? doc.codes.length : 0
                };
            })
        );
        const payload = { livestreams: latestDocs, fetchedAt: new Date().toISOString() };
        apiCache.set('livestreams_status', { data: payload, timestamp: Date.now() });
        res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
        return res.json(payload);
    } catch (error) {
        console.error('Error fetching livestream status:', error);
        return res.status(500).json({ error: 'Failed to fetch livestream status' });
    }
});

// Authenticated bridge handshake & latency probe for Vercel dashboard
app.get('/api/bot/ping', (req, res) => {
    res.json({
        ok: true,
        botReady: Boolean(client && client.isReady()),
        shardCount: client?.shard ? client.shard.count : 1,
        authMode: req.dashboardAuth?.mode || 'unknown',
        serverTime: Date.now(),
        requestId: req.requestId || null
    });
});

// Discord Bot Stats API Endpoints
app.get('/api/bot/stats', async (req, res) => {
    try {
        if (!client || !client.isReady()) {
            return res.status(503).json({ error: 'Bot is not ready' });
        }

        const shardStats = await getClusterStats();
        const memoryUsage = shardStats.reduce((total, shard) => ({
            rss: total.rss + shard.memoryUsage.rss,
            heapTotal: total.heapTotal + shard.memoryUsage.heapTotal,
            heapUsed: total.heapUsed + shard.memoryUsage.heapUsed,
            external: total.external + shard.memoryUsage.external,
            arrayBuffers: total.arrayBuffers + (shard.memoryUsage.arrayBuffers || 0)
        }), {
            rss: 0,
            heapTotal: 0,
            heapUsed: 0,
            external: 0,
            arrayBuffers: 0
        });
        const responsivePings = shardStats
            .map(shard => shard.ping)
            .filter(ping => Number.isFinite(ping) && ping >= 0);

        const stats = {
            guildCount: shardStats.reduce((sum, shard) => sum + shard.guildCount, 0),
            userCount: shardStats.reduce((sum, shard) => sum + shard.userCount, 0),
            channelCount: shardStats.reduce((sum, shard) => sum + shard.channelCount, 0),
            shardCount: shardStats.length,
            uptime: Math.min(...shardStats.map(shard => shard.uptime)),
            memoryUsage,
            botUser: {
                username: client.user.username,
                discriminator: client.user.discriminator,
                id: client.user.id,
                avatar: client.user.displayAvatarURL({ extension: 'png', size: 256 })
            },
            status: shardStats.every(shard => shard.status === 0) ? 0 : 1,
            ping: responsivePings.length > 0
                ? Math.round(responsivePings.reduce((sum, ping) => sum + ping, 0) / responsivePings.length)
                : -1,
            version: process.env.VERSION || '1.0.0',
            nodeVersion: process.version
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching bot stats:', error);
        res.status(500).json({ error: 'Failed to fetch bot stats' });
    }
});

app.get('/api/bot/guilds', async (req, res) => {
    try {
        if (!client || !client.isReady()) {
            return res.status(503).json({ error: 'Bot is not ready' });
        }

        const guilds = await getClusterGuilds();

        res.json({ guilds, total: guilds.length });
    } catch (error) {
        console.error('Error fetching guild info:', error);
        res.status(500).json({ error: 'Failed to fetch guild info' });
    }
});

app.get('/api/bot/commands', async (req, res) => {
    try {
        const commands = client.commands.map(command => ({
            name: command.data.name,
            description: command.data.description,
            options: command.data.options || []
        }));

        res.json({ commands, total: commands.length });
    } catch (error) {
        console.error('Error fetching commands:', error);
        res.status(500).json({ error: 'Failed to fetch commands' });
    }
});

// Individual guild info endpoint
app.get('/api/bot/guild/:guildId', async (req, res) => {
    try {
        const guildId = getValidatedGuildId(req.params.guildId);
        if (!guildId) {
            return res.status(400).json({ error: 'Invalid guild ID format' });
        }

        if (!client || !client.isReady()) {
            return res.status(503).json({ error: 'Bot is not ready' });
        }

        const guildInfo = await getGuildAcrossShards(guildId);
        if (!guildInfo) {
            return res.status(404).json({ error: 'Guild not found' });
        }

        res.json(guildInfo);
    } catch (error) {
        console.error('Error fetching guild info:', error);
        res.status(500).json({ error: 'Failed to fetch guild info' });
    }
});

async function fetchVerifiedGuildThread(serverId, threadId) {
    if (!threadId || !client?.rest) {
        return null;
    }

    try {
        const channelData = await client.rest.get(Routes.channel(threadId));
        if (
            channelData
            && channelData.guild_id === serverId
            && (channelData.type === 11 || channelData.type === 12)
        ) {
            return {
                id: channelData.id,
                name: channelData.name || threadId,
                type: channelData.type,
                parentId: channelData.parent_id || null,
                archived: Boolean(channelData.thread_metadata?.archived),
                canEmbed: true
            };
        }
    } catch {
        // Thread does not exist or bot has no access
    }

    return null;
}

async function verifyConfigPatchOwnership(serverId, patch, guild) {
    if (configPatchBelongsToGuild(patch, guild)) {
        return true;
    }

    // Validate all non-thread fields strictly against cached guild roles & channels first.
    const nonThreadPatch = {};
    for (const [key, value] of Object.entries(patch)) {
        if (key !== 'forumThreads') {
            nonThreadPatch[key] = value;
        }
    }
    if (!configPatchBelongsToGuild(nonThreadPatch, guild)) {
        return false;
    }

    if (!patch.forumThreads || typeof patch.forumThreads !== 'object') {
        return false;
    }

    const cachedThreadIds = new Set((guild.threads || []).map(item => item.id));
    for (const threadId of Object.values(patch.forumThreads)) {
        if (threadId === null || cachedThreadIds.has(threadId)) {
            continue;
        }
        // ThreadManager sweeps inactive threads after 1h; verify ownership via REST before rejecting.
        const verifiedThread = await fetchVerifiedGuildThread(serverId, threadId);
        if (!verifiedThread) {
            return false;
        }
    }

    return true;
}

function serializeServerConfig(serverId, config) {
    return {
        guildId: config?.guildId || serverId,
        genshinRole: config?.genshinRole || null,
        hsrRole: config?.hsrRole || null,
        zzzRole: config?.zzzRole || null,
        channel: config?.channel || null,
        livestreamChannel: config?.livestreamChannel || null,
        forumThreads: {
            genshin: config?.forumThreads?.genshin || null,
            hsr: config?.forumThreads?.hsr || null,
            zzz: config?.forumThreads?.zzz || null
        }
    };
}

function serializeServerSettings(serverId, settings) {
    if (!settings) {
        return {
            guildId: serverId,
            autoSendEnabled: true,
            autoSendOptions: { channel: true, threads: true },
            livestreamAnnouncementsEnabled: true,
            favoriteGames: {
                enabled: false,
                games: {
                    genshin: true,
                    hkrpg: true,
                    nap: true
                }
            },
            channelStatus: {
                isInvalid: false,
                lastError: null,
                lastChecked: null
            }
        };
    }
    return {
        guildId: settings.guildId,
        autoSendEnabled: settings.autoSendEnabled,
        autoSendOptions: settings.autoSendOptions,
        livestreamAnnouncementsEnabled: settings.livestreamAnnouncementsEnabled,
        favoriteGames: settings.favoriteGames,
        channelStatus: {
            isInvalid: Boolean(settings.channelStatus?.isInvalid),
            lastError: settings.channelStatus?.lastError || null,
            lastChecked: settings.channelStatus?.lastChecked
                ? new Date(settings.channelStatus.lastChecked).toISOString()
                : null
        }
    };
}

function applyConfigPatch(config, updateData) {
    if (Object.hasOwn(updateData, 'genshinRole')) {
        config.genshinRole = updateData.genshinRole;
    }
    if (Object.hasOwn(updateData, 'hsrRole')) {
        config.hsrRole = updateData.hsrRole;
    }
    if (Object.hasOwn(updateData, 'zzzRole')) {
        config.zzzRole = updateData.zzzRole;
    }
    if (Object.hasOwn(updateData, 'channel')) {
        config.channel = updateData.channel;
    }
    if (Object.hasOwn(updateData, 'livestreamChannel')) {
        config.livestreamChannel = updateData.livestreamChannel;
    }
    if (Object.hasOwn(updateData, 'forumThreads')) {
        if (!config.forumThreads) {
            config.forumThreads = {};
        }
        for (const game of ['genshin', 'hsr', 'zzz']) {
            if (Object.hasOwn(updateData.forumThreads, game)) {
                config.forumThreads[game] = updateData.forumThreads[game];
            }
        }
    }
}

// Unified server snapshot endpoint (replaces 4 separate Vercel -> VPS requests with 1)
app.get('/api/server/:serverId/snapshot', async (req, res) => {
    try {
        const serverId = getValidatedGuildId(req.params.serverId);
        if (!serverId) {
            return res.status(400).json({ error: 'Invalid server ID format' });
        }
        if (!client || !client.isReady()) {
            return res.status(503).json({ error: 'Bot is not ready' });
        }

        const Config = require('../models/Config');
        const Settings = require('../models/Settings');
        const Language = require('../models/Language');

        const [guild, config, settings, langConfig] = await Promise.all([
            getGuildAcrossShards(serverId),
            Config.findOne({ guildId: serverId }).sort({ _id: -1 }),
            Settings.findOne({ guildId: serverId }).sort({ _id: -1 }),
            Language.findOne({ guildId: serverId })
        ]);

        if (!guild) {
            return res.status(404).json({ error: 'Server not found' });
        }

        return res.json({
            guild,
            config: serializeServerConfig(serverId, config),
            settings: serializeServerSettings(serverId, settings),
            language: langConfig ? langConfig.language : 'en',
            fetchedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching server snapshot:', error);
        return res.status(500).json({ error: 'Failed to fetch server snapshot' });
    }
});

// Unified atomic server update endpoint (saves config + settings + language in 1 signed request)
app.put('/api/server/:serverId/snapshot', async (req, res) => {
    try {
        const serverId = getValidatedGuildId(req.params.serverId);
        if (!serverId) {
            return res.status(400).json({ error: 'Invalid server ID format' });
        }
        if (!client || !client.isReady()) {
            return res.status(503).json({ error: 'Bot is not ready' });
        }
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            return res.status(400).json({ error: 'Invalid snapshot payload' });
        }

        const hasConfig = Object.hasOwn(req.body, 'config');
        const hasSettings = Object.hasOwn(req.body, 'settings');
        const hasLanguage = Object.hasOwn(req.body, 'language');
        if (!hasConfig && !hasSettings && !hasLanguage) {
            return res.status(400).json({ error: 'At least one of config, settings, or language is required' });
        }

        const configPatch = hasConfig ? getValidatedConfigPatch(req.body.config) : null;
        if (hasConfig && !configPatch) {
            return res.status(400).json({ error: 'Invalid channel, thread, or role configuration' });
        }

        const settingsPatch = hasSettings ? getValidatedSettingsPatch(req.body.settings) : null;
        if (hasSettings && !settingsPatch) {
            return res.status(400).json({ error: 'Settings must use boolean values' });
        }

        const validatedLanguage = hasLanguage ? getValidatedLanguage(req.body.language) : null;
        if (hasLanguage && !validatedLanguage) {
            return res.status(400).json({ error: 'Invalid language code' });
        }

        const guild = await getGuildAcrossShards(serverId);
        if (!guild) {
            return res.status(404).json({ error: 'Server not found' });
        }
        if (hasConfig && !(await verifyConfigPatchOwnership(serverId, configPatch, guild))) {
            return res.status(400).json({ error: 'Channel, threads, and roles must belong to this server' });
        }

        const Config = require('../models/Config');
        const Settings = require('../models/Settings');
        const Language = require('../models/Language');

        const tasks = [];
        let savedConfig = null;
        let savedSettings = null;
        let savedLanguage = null;

        if (hasConfig) {
            tasks.push((async () => {
                let config = await Config.findOne({ guildId: serverId }).sort({ _id: -1 });
                if (!config) {
                    config = new Config({
                        guildId: serverId,
                        genshinRole: null,
                        hsrRole: null,
                        zzzRole: null,
                        channel: null,
                        livestreamChannel: null,
                        forumThreads: { genshin: null, hsr: null, zzz: null }
                    });
                }
                applyConfigPatch(config, configPatch);
                await config.save();
                await removeOtherGuildRecords(Config, serverId, config._id);
                savedConfig = config;
            })());
        } else {
            tasks.push(Config.findOne({ guildId: serverId }).sort({ _id: -1 }).then(c => { savedConfig = c; }));
        }

        if (hasSettings) {
            tasks.push((async () => {
                let settings = await Settings.findOne({ guildId: serverId }).sort({ _id: -1 });
                if (!settings) {
                    settings = new Settings({ guildId: serverId });
                }
                for (const [field, value] of Object.entries(settingsPatch)) {
                    settings.set(field, value);
                }
                await settings.save();
                await removeOtherGuildRecords(Settings, serverId, settings._id);
                savedSettings = settings;
            })());
        } else {
            tasks.push(Settings.findOne({ guildId: serverId }).sort({ _id: -1 }).then(s => { savedSettings = s; }));
        }

        if (hasLanguage) {
            tasks.push(
                Language.findOneAndUpdate(
                    { guildId: serverId },
                    { $set: { language: validatedLanguage } },
                    { upsert: true, setDefaultsOnInsert: true, runValidators: true }
                ).then(() => {
                    languageManager.clearGuildCache(serverId);
                    savedLanguage = validatedLanguage;
                })
            );
        } else {
            tasks.push(Language.findOne({ guildId: serverId }).then(l => { savedLanguage = l ? l.language : 'en'; }));
        }

        await Promise.all(tasks);

        logDashboardAudit(req, 'server.snapshot.update', {
            serverId,
            sections: [hasConfig && 'config', hasSettings && 'settings', hasLanguage && 'language'].filter(Boolean)
        });

        return res.json({
            guild,
            config: serializeServerConfig(serverId, savedConfig),
            settings: serializeServerSettings(serverId, savedSettings),
            language: savedLanguage || 'en',
            fetchedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating server snapshot:', error);
        return res.status(500).json({ error: 'Failed to update server snapshot' });
    }
});

// Server configuration endpoint
app.get('/api/server/:serverId/config', async (req, res) => {
    try {
        const serverId = getValidatedGuildId(req.params.serverId);
        if (!serverId) {
            return res.status(400).json({ error: 'Invalid server ID format' });
        }

        const Config = require('../models/Config');
        const config = await Config.findOne({ guildId: serverId }).sort({ _id: -1 });

        res.json(serializeServerConfig(serverId, config));
    } catch (error) {
        console.error('Error fetching server config:', error);
        res.status(500).json({ error: 'Failed to fetch server config' });
    }
});

// Update server config endpoint
app.put('/api/server/:serverId/config', async (req, res) => {
    try {
        const serverId = getValidatedGuildId(req.params.serverId);
        if (!serverId) {
            return res.status(400).json({ error: 'Invalid server ID format' });
        }
        if (!client || !client.isReady()) {
            return res.status(503).json({ error: 'Bot is not ready' });
        }
        const updateData = getValidatedConfigPatch(req.body);
        if (!updateData) return res.status(400).json({ error: 'Invalid channel, thread, or role configuration' });
        const guild = await getGuildAcrossShards(serverId);
        if (!guild) return res.status(404).json({ error: 'Server not found' });
        if (!(await verifyConfigPatchOwnership(serverId, updateData, guild))) {
            return res.status(400).json({ error: 'Channel, threads, and roles must belong to this server' });
        }

        const Config = require('../models/Config');

        let config = await Config.findOne({ guildId: serverId }).sort({ _id: -1 });

        if (!config) {
            config = new Config({
                guildId: serverId,
                genshinRole: null,
                hsrRole: null,
                zzzRole: null,
                channel: null,
                livestreamChannel: null,
                forumThreads: { genshin: null, hsr: null, zzz: null }
            });
        }

        applyConfigPatch(config, updateData);
        await config.save();
        await removeOtherGuildRecords(Config, serverId, config._id);

        logDashboardAudit(req, 'server.config.update', { serverId, fields: Object.keys(updateData) });
        res.json(serializeServerConfig(serverId, config));
    } catch (error) {
        console.error('Error updating server config:', error);
        res.status(500).json({ error: 'Failed to update server config' });
    }
});

// Language API Endpoints
app.get('/api/server/:serverId/language', async (req, res) => {
    try {
        const serverId = getValidatedGuildId(req.params.serverId);
        if (!serverId) {
            return res.status(400).json({ error: 'Invalid server ID format' });
        }
        const Language = require('../models/Language');
        const langConfig = await Language.findOne({ guildId: serverId });

        res.json({
            guildId: serverId,
            language: langConfig ? langConfig.language : 'en'
        });
    } catch (error) {
        console.error('Error fetching server language:', error);
        res.status(500).json({ error: 'Failed to fetch server language' });
    }
});

app.put('/api/server/:serverId/language', async (req, res) => {
    try {
        const serverId = getValidatedGuildId(req.params.serverId);
        if (!serverId) {
            return res.status(400).json({ error: 'Invalid server ID format' });
        }
        const language = getValidatedLanguage(req.body?.language);

        if (!language) {
            return res.status(400).json({ error: 'Invalid language code' });
        }

        const Language = require('../models/Language');
        await Language.findOneAndUpdate(
            { guildId: serverId },
            { $set: { language } },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
        );
        languageManager.clearGuildCache(serverId);

        logDashboardAudit(req, 'server.language.update', { serverId, language });
        res.json({ success: true, language });
    } catch (error) {
        console.error('Error updating server language:', error);
        res.status(500).json({ error: 'Failed to update server language' });
    }
});

// Server settings endpoint
app.get('/api/server/:serverId/settings', async (req, res) => {
    try {
        const serverId = getValidatedGuildId(req.params.serverId);
        if (!serverId) {
            return res.status(400).json({ error: 'Invalid server ID format' });
        }

        const Settings = require('../models/Settings');
        const settings = await Settings.findOne({ guildId: serverId }).sort({ _id: -1 });

        res.json(serializeServerSettings(serverId, settings));
    } catch (error) {
        console.error('Error fetching server settings:', error);
        res.status(500).json({ error: 'Failed to fetch server settings' });
    }
});

// Update server settings endpoint
app.put('/api/server/:serverId/settings', async (req, res) => {
    try {
        const serverId = getValidatedGuildId(req.params.serverId);
        if (!serverId) {
            return res.status(400).json({ error: 'Invalid server ID format' });
        }
        const updateData = getValidatedSettingsPatch(req.body);
        if (!updateData) return res.status(400).json({ error: 'Settings must use boolean values' });

        const Settings = require('../models/Settings');

        let settings = await Settings.findOne({ guildId: serverId }).sort({ _id: -1 });

        if (!settings) {
            settings = new Settings({ guildId: serverId });
        }

        for (const [field, value] of Object.entries(updateData)) settings.set(field, value);

        await settings.save();
        await removeOtherGuildRecords(Settings, serverId, settings._id);

        logDashboardAudit(req, 'server.settings.update', { serverId, fields: Object.keys(updateData) });
        res.json(serializeServerSettings(serverId, settings));
    } catch (error) {
        console.error('Error updating server settings:', error);
        res.status(500).json({ error: 'Failed to update server settings' });
    }
});

const DASHBOARD_GAME_META = {
    genshin: {
        name: 'Genshin Impact',
        apiKey: 'genshin',
        apiUrl: 'https://hoyo-codes.seria.moe/codes?game=genshin',
        color: '#8B5CF6',
        roleField: 'genshinRole',
        redeemBase: 'https://genshin.hoyoverse.com/en/gift?code='
    },
    hsr: {
        name: 'Honkai: Star Rail',
        apiKey: 'hkrpg',
        apiUrl: 'https://hoyo-codes.seria.moe/codes?game=hkrpg',
        color: '#3B82F6',
        roleField: 'hsrRole',
        redeemBase: 'https://hsr.hoyoverse.com/gift?code='
    },
    zzz: {
        name: 'Zenless Zone Zero',
        apiKey: 'nap',
        apiUrl: 'https://hoyo-codes.seria.moe/codes?game=nap',
        color: '#FF5D1F',
        roleField: 'zzzRole',
        redeemBase: 'https://zenless.hoyoverse.com/redemption?code='
    }
};

// Test notification endpoint (rate-limited per server)
app.post('/api/server/:serverId/test', testNotificationLimiter, async (req, res) => {
    try {
        const serverId = getValidatedGuildId(req.params.serverId);
        if (!serverId) {
            return res.status(400).json({ error: 'Invalid server ID format' });
        }
        if (!client || !client.isReady()) {
            return res.status(503).json({ error: 'Bot is not ready' });
        }
        const testPayload = getValidatedTestPayload(req.body);
        if (!testPayload) {
            return res.status(400).json({ error: 'Invalid test game selection' });
        }

        const Config = require('../models/Config');
        const config = await Config.findOne({ guildId: serverId }).sort({ _id: -1 });

        if (!config || !config.channel) {
            return res.status(400).json({ error: 'No notification channel configured' });
        }

        const guild = await getGuildAcrossShards(serverId);
        if (!guild) {
            return res.status(404).json({ error: 'Server not found' });
        }

        const channel = guild.channels.find(item => item.id === config.channel);
        if (!channel) {
            return res.status(400).json({ error: 'Notification channel not found' });
        }
        if (channel.canEmbed === false) {
            return res.status(400).json({ error: 'Bot is missing Embed Links permission in the configured channel' });
        }

        const { EmbedBuilder } = require('discord.js');
        if (testPayload.game) {
            const meta = DASHBOARD_GAME_META[testPayload.game];
            const roleId = config[meta.roleField] || null;
            const roleValid = Boolean(roleId && guild.roles.some(role => role.id === roleId));
            const feed = await getCachedApiData(meta.apiKey, meta.apiUrl).catch(() => null);
            const liveList = Array.isArray(feed?.codes) ? feed.codes : [];
            const liveCode = liveList.find(c => c.status === 'OK' && !c.isExpired && c.code)
                || liveList.find(c => !c.isExpired && c.code)
                || liveList[0]
                || null;

            if (!liveCode) {
                return res.status(404).json({ error: `No active ${meta.name} codes available right now to test delivery.` });
            }

            const rewardsText = liveCode.rewards ? String(liveCode.rewards).replace(/;/g, ' · ') : 'In-game rewards';
            const embed = new EmbedBuilder()
                .setColor(meta.color)
                .setTitle(`🧪 ${meta.name} Test Alert`)
                .setDescription(`**${liveCode.code}** — ${rewardsText}\n[Redeem on HoYoLAB](${meta.redeemBase}${encodeURIComponent(liveCode.code)})`)
                .addFields(
                    { name: 'Channel', value: `<#${config.channel}>`, inline: true },
                    { name: 'Source', value: 'Live code feed', inline: true }
                )
                .setFooter({ text: 'Dashboard test delivery' })
                .setTimestamp();

            await sendChannelMessage(client, config.channel, {
                content: roleValid ? `<@&${roleId}>` : undefined,
                embeds: [embed],
                allowedMentions: { parse: [], roles: roleValid ? [roleId] : [] }
            }, { guildId: serverId });

            logDashboardAudit(req, 'server.test.live', { serverId, channelId: config.channel, game: testPayload.game });
            return res.json({ success: true, message: `Sent ${meta.name} test (${liveCode.code}) to #${channel.name}.` });
        }

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🧪 Test Notification')
            .setDescription('This is a test notification from HoYo Code Sender!')
            .addFields(
                { name: '✅ Channel', value: `<#${config.channel}>`, inline: true },
                { name: '🤖 Bot', value: 'Working correctly!', inline: true }
            )
            .setFooter({ text: 'Test completed successfully' })
            .setTimestamp();

        await sendChannelMessage(client, config.channel, { embeds: [embed] }, { guildId: serverId });

        logDashboardAudit(req, 'server.test.sent', { serverId, channelId: config.channel });
        res.json({ success: true, message: `Test notification sent to #${channel.name}!` });
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({ error: 'Failed to send test notification' });
    }
});

// Live channel & permission verification endpoint
app.post('/api/server/:serverId/check-channels', async (req, res) => {
    try {
        const serverId = getValidatedGuildId(req.params.serverId);
        if (!serverId) {
            return res.status(400).json({ error: 'Invalid server ID format' });
        }
        if (!client || !client.isReady()) {
            return res.status(503).json({ error: 'Bot is not ready' });
        }

        const Config = require('../models/Config');
        const Settings = require('../models/Settings');
        const [guild, config] = await Promise.all([
            getGuildAcrossShards(serverId),
            Config.findOne({ guildId: serverId }).sort({ _id: -1 })
        ]);
        if (!guild) {
            return res.status(404).json({ error: 'Server not found' });
        }

        const targets = [];
        const checkTarget = async (label, id, isThread = false) => {
            if (!id) {
                targets.push({ label, id: null, name: null, status: 'unset', canEmbed: null });
                return;
            }
            if (isThread) {
                let thread = guild.threads.find(item => item.id === id);
                if (!thread) {
                    const fetchedThread = await fetchVerifiedGuildThread(serverId, id);
                    if (fetchedThread && !fetchedThread.archived) {
                        thread = fetchedThread;
                    }
                }
                targets.push(thread
                    ? {
                        label,
                        id,
                        name: thread.name,
                        status: thread.canEmbed === false ? 'missing_embed' : 'ok',
                        canEmbed: thread.canEmbed !== false
                    }
                    : { label, id, name: null, status: 'missing', canEmbed: false });
                return;
            }
            const ch = guild.channels.find(item => item.id === id);
            if (!ch) {
                targets.push({ label, id, name: null, status: 'missing', canEmbed: false });
                return;
            }
            targets.push({
                label,
                id,
                name: ch.name,
                status: ch.canEmbed === false ? 'missing_embed' : 'ok',
                canEmbed: ch.canEmbed !== false
            });
        };

        await checkTarget('Main channel', config?.channel || null, false);
        if (config?.livestreamChannel) {
            await checkTarget('Livestream channel', config.livestreamChannel, false);
        }
        for (const game of ['zzz', 'genshin', 'hsr']) {
            if (config?.forumThreads?.[game]) {
                await checkTarget(`${DASHBOARD_GAME_META[game].name} thread`, config.forumThreads[game], true);
            }
        }

        const mainTarget = targets[0];
        const valid = Boolean(config?.channel && mainTarget?.status === 'ok');
        const lastError = !config?.channel
            ? 'No notification channel configured'
            : mainTarget?.status === 'missing'
                ? 'Configured channel not found or missing Send Messages permission'
                : mainTarget?.status === 'missing_embed'
                    ? 'Missing Embed Links permission in main channel'
                    : null;
        const checkedAt = new Date();

        const updatedSettings = await Settings.findOneAndUpdate(
            { guildId: serverId },
            {
                'channelStatus.isInvalid': !valid,
                'channelStatus.lastError': lastError,
                'channelStatus.lastChecked': checkedAt
            },
            { upsert: true, new: true, sort: { _id: -1 } }
        );
        await removeOtherGuildRecords(Settings, serverId, updatedSettings?._id);

        logDashboardAudit(req, 'server.channels.checked', { serverId, valid });
        return res.json({
            valid,
            error: lastError,
            checkedAt: checkedAt.toISOString(),
            targets
        });
    } catch (error) {
        console.error('Error checking server channels:', error);
        return res.status(500).json({ error: 'Failed to check channel permissions' });
    }
});

// Manual code broadcast endpoint (dashboard equivalent of /postcode, rate-limited per server)
app.post('/api/server/:serverId/post-code', testNotificationLimiter, async (req, res) => {
    try {
        const serverId = getValidatedGuildId(req.params.serverId);
        if (!serverId) {
            return res.status(400).json({ error: 'Invalid server ID format' });
        }
        const payload = getValidatedPostCodePayload(req.body);
        if (!payload) {
            return res.status(400).json({ error: 'Provide a valid game and 1-3 alphanumeric codes.' });
        }
        if (!client || !client.isReady()) {
            return res.status(503).json({ error: 'Bot is not ready' });
        }

        const Config = require('../models/Config');
        const Settings = require('../models/Settings');
        const [guild, config, settings] = await Promise.all([
            getGuildAcrossShards(serverId),
            Config.findOne({ guildId: serverId }).sort({ _id: -1 }),
            Settings.findOne({ guildId: serverId }).sort({ _id: -1 })
        ]);
        if (!guild) {
            return res.status(404).json({ error: 'Server not found' });
        }

        const meta = DASHBOARD_GAME_META[payload.game];
        const threadId = config?.forumThreads?.[payload.game] || null;
        let threadObj = threadId ? guild.threads.find(item => item.id === threadId) : null;
        if (threadId && !threadObj && (payload.target === 'thread' || payload.target === 'auto')) {
            const fetchedThread = await fetchVerifiedGuildThread(serverId, threadId);
            if (fetchedThread && !fetchedThread.archived) {
                threadObj = fetchedThread;
            }
        }
        const liveObj = config?.livestreamChannel ? guild.channels.find(item => item.id === config.livestreamChannel) : null;
        const mainObj = config?.channel ? guild.channels.find(item => item.id === config.channel) : null;

        let chosenTarget = null;
        if (payload.target === 'thread') chosenTarget = threadObj;
        else if (payload.target === 'livestream') chosenTarget = liveObj || mainObj;
        else if (payload.target === 'channel') chosenTarget = mainObj;
        else chosenTarget = (settings?.autoSendOptions?.threads !== false && threadObj) ? threadObj : mainObj;

        if (!chosenTarget) {
            return res.status(400).json({ error: 'No valid configured channel or thread found for this destination.' });
        }
        if (chosenTarget.canEmbed === false) {
            return res.status(400).json({ error: 'Bot is missing Embed Links permission in the selected destination.' });
        }

        const embedTitle = await languageManager.getString('commands.postcode.embedTitle', serverId, { game: meta.name })
            || `${meta.name} Redemption Codes`;
        const redeemLabel = await languageManager.getString('commands.postcode.postcodeButton', serverId)
            || 'Redeem on HoYoLAB';
        const messageLabel = await languageManager.getString('commands.postcode.messageLabel', serverId)
            || 'Note';

        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor(meta.color)
            .setTitle(embedTitle)
            .setDescription(
                payload.codes
                    .map(code => `**${code}**\n[${redeemLabel}](${meta.redeemBase}${encodeURIComponent(code)})`)
                    .join('\n\n')
            )
            .setTimestamp();

        if (payload.message) {
            embed.addFields({ name: messageLabel, value: payload.message });
        }

        const roleId = payload.mentionRole ? (config?.[meta.roleField] || null) : null;
        const roleValid = Boolean(roleId && guild.roles.some(role => role.id === roleId));

        await sendChannelMessage(client, chosenTarget.id, {
            content: roleValid ? `<@&${roleId}>` : undefined,
            embeds: [embed],
            allowedMentions: { parse: [], roles: roleValid ? [roleId] : [] }
        }, { guildId: serverId });

        logDashboardAudit(req, 'server.postcode.sent', {
            serverId,
            game: payload.game,
            targetId: chosenTarget.id,
            codeCount: payload.codes.length
        });

        return res.json({
            success: true,
            message: `Posted ${payload.codes.length} ${meta.name} code${payload.codes.length > 1 ? 's' : ''} to #${chosenTarget.name}.`,
            targetId: chosenTarget.id,
            targetName: chosenTarget.name
        });
    } catch (error) {
        console.error('Error posting manual code from dashboard:', error);
        return res.status(500).json({ error: 'Failed to post codes to Discord.' });
    }
});

// Reset configuration endpoint (rate-limited per server)
app.post('/api/server/:serverId/reset', resetConfigLimiter, async (req, res) => {
    try {
        const serverId = getValidatedGuildId(req.params.serverId);
        if (!serverId) {
            return res.status(400).json({ error: 'Invalid server ID format' });
        }

        const Config = require('../models/Config');
        const Settings = require('../models/Settings');
        const Language = require('../models/Language');

        await Promise.all([
            Config.deleteMany({ guildId: serverId }),
            Settings.deleteMany({ guildId: serverId }),
            Language.deleteMany({ guildId: serverId })
        ]);
        languageManager.clearGuildCache(serverId);

        logDashboardAudit(req, 'server.config.reset', { serverId });
        res.json({ success: true, message: 'Configuration reset successfully!' });
    } catch (error) {
        console.error('Error resetting configuration:', error);
        res.status(500).json({ error: 'Failed to reset configuration' });
    }
});

// Clear old cache entries every hour
const apiCacheCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of apiCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION * 2) { // Clear if 2x older than cache duration
            apiCache.delete(key);
        }
    }
}, 60 * 60 * 1000); // Every hour
apiCacheCleanupInterval.unref?.();

// Serve HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// The single bot process owns HTTP, webhooks, and other singleton services.
if (runsPrimaryServices) {
    if (!process.env.AUTH_BOT_SECRET || process.env.AUTH_BOT_SECRET.trim().length < 32) {
        console.warn('⚠️  AUTH_BOT_SECRET should be at least 32 random characters for secure Vercel <-> VPS communication.');
    }
    httpServer = app.listen(PORT, API_BIND_HOST, () => {
        console.log(`Web server running on ${API_BIND_HOST}:${PORT}`);
    });
    // Keep-alive timeouts tuned above common reverse proxy defaults (nginx / Cloudflare = 60s)
    httpServer.keepAliveTimeout = 65_000;
    httpServer.headersTimeout = 66_000;
    httpServer.requestTimeout = 30_000;
}

// Discord bot setup - Enhanced environment validation
const requiredEnvVars = [
    'DISCORD_TOKEN',
    'CLIENT_ID',
    'MONGODB_URI'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
}

// Optional environment variables with warnings
const optionalEnvVars = {
    'WEBHOOK_PASSWORD': 'Top.gg webhook functionality will be disabled',
    'TOPGG_TOKEN': 'Vote checking functionality will be limited',
    'VERSION': 'Version display will show as undefined'
};

Object.entries(optionalEnvVars).forEach(([varName, warning]) => {
    if (!process.env[varName]) {
        console.warn(`⚠️  Optional environment variable missing: ${varName} - ${warning}`);
    }
});

console.log('✅ Environment validation completed');

// ShardingManager injects SHARDS/SHARD_COUNT for child processes. Leaving
// shards unset lets discord.js consume those values.
const client = new Client(createDiscordClientOptions());

client.commands = new Collection();

function loadCommands() {
    const commands = [];
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        delete require.cache[require.resolve(filePath)];
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            client.commands.set(command.data.name, command);
        }
    }

    console.log(`Loaded ${commands.length} command handler(s)`);
    return commands;
}

const registeredCommandPayload = loadCommands();

// Register commands with Discord once on startup.
async function registerCommands() {
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: registeredCommandPayload }
        );
        console.log('Successfully registered application commands.');
        return true;
    } catch (error) {
        console.error('Error registering commands:', error);
        return false;
    }
}

// Connect to MongoDB and start bot. A failed initial connection exits this
// shard so ShardingManager can respawn it instead of leaving a zombie process.
async function connectServices() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        await client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
        console.error('[Startup] MongoDB or Discord connection failed:', error);
        await shutdown('STARTUP_CONNECTION_ERROR', 1);
    }
}

void connectServices();

client.once('clientReady', async () => {
    const wsShardIds = Array.from(client.ws.shards.keys());
    console.log(`Logged in as ${client.user.tag} | WS Shards: [${wsShardIds.join(', ')}] | Primary: ${runsPrimaryServices}`);
    const identityError = getDiscordIdentityError(client.user, process.env.CLIENT_ID);
    if (identityError) {
        console.error(`[Startup] ${identityError}`);
        console.error('[Startup] Use DISCORD_TOKEN and CLIENT_ID from the same Discord application.');
        await shutdown('CONFIG_ERROR', 1);
        return;
    }

    selfMaintenance = createSelfMaintenance({
        client,
        shardIds: wsShardIds,
        getMongoReadyState: () => mongoose.connection.readyState,
        onUnhealthy: () => shutdown('SELF_MAINTENANCE', 1)
    });

    try {
        // Only register commands from one shard to avoid rate limits
        if (runsPrimaryServices) {
            const registered = await registerCommands();
            if (registered) {
                console.log('Commands registered successfully');
            }
        }
    } catch (error) {
        console.error('Error during startup:', error);
    }
    const updatePresence = () => {
        if (!client.isReady() || !client.user) {
            return;
        }
        try {
            client.user.setPresence({
                activities: [{
                    name: `for redemption codes | ${process.env.VERSION || '1.15.0'}`,
                    type: ActivityType.Watching
                }],
                status: 'online'
            });
        } catch (error) {
            console.warn('[Presence] Failed to update presence:', error.message);
        }
    };

    // Set immediately on startup
    updatePresence();

    // Refresh presence every 30 minutes so it doesn't disappear
    presenceInterval = setInterval(updatePresence, 30 * 60 * 1000);
    presenceInterval.unref?.();

    // Singleton background tasks — only run on shard 0
    if (runsPrimaryServices) {
        let configAudit;
        try {
            configAudit = await auditGuildConfigurations(client);
        } catch (error) {
            console.error('[Config Audit] Startup audit failed:', error.message);
        }

        if (shouldRunConfigRecovery(configAudit)) {
            try {
                const recovery = await recoverMissingGuildConfigurations(
                    client,
                    configAudit.missingConfigGuildIds
                );
                if (recovery.recovered > 0) {
                    configAudit = await auditGuildConfigurations(client);
                }
            } catch (error) {
                console.error('[Config Recovery] Startup recovery failed:', error);
            }
        }

        try {
            const roleMigration = await reconcileAllConfiguredRoles(client);
            console.log(`[Role Config] Startup reconciliation complete: ${JSON.stringify(roleMigration)}`);
        } catch (error) {
            console.error('[Role Config] Startup reconciliation failed:', error);
        }

        // Start regular code checking (every 5 minutes)
        codeCheckInterval = setInterval(() => {
            checkAndSendNewCodes(client).catch(error => {
                console.error('Scheduled code check failed:', error);
            });
        }, 5 * 60 * 1000);
        // Run initial code check immediately on startup
        checkAndSendNewCodes(client).catch(error => {
            console.error('Initial code check failed:', error);
        });

        // Check for year change messages (every 30 minutes)
        yearCheckInterval = setInterval(() => {
            checkAndSendYearChangeMessage(client).catch(error => {
                console.error('Scheduled year change check failed:', error);
            });
        }, 30 * 60 * 1000);
        checkAndSendYearChangeMessage(client).catch(error => {
            console.error('Initial year change check failed:', error);
        });

        if (process.env.LIVESTREAM_TRACKING_ENABLED !== 'false') {
            try {
                await startPostTracker(client);
            } catch (error) {
                console.error('[Post Tracker] Startup failed:', error);
            }
            startLivestreamChecker(client);
        } else {
            console.log('[Livestream] Tracking disabled by LIVESTREAM_TRACKING_ENABLED=false');
        }
    } else {
        console.log(`[Shard ${wsShardIds.join(',')}] Running as worker (no singleton services)`);
    }
});

// Add event listeners for guild join/leave
client.on('guildCreate', async (guild) => {
    console.log(`Joined new guild: ${guild.name} (${guild.id})`);

    // Send welcome message with setup instructions
    await sendWelcomeMessage(guild, client);
});

client.on('guildDelete', async (guild) => {
    console.log(`Removed from guild: ${guild.name} (${guild.id})`);
    // Config is shared by multiple bot applications. Keep it until an admin
    // explicitly removes the setup so one bot cannot delete another bot's data.
});

// After Express and client setup
if (runsPrimaryServices) {
    setupTopggWebhook(app, client);
}

// Final Express error handler: always respond with JSON rather than an HTML stack trace
app.use((err, req, res, _next) => {
    console.error('[HTTP] Unhandled Express error:', err);
    if (res.headersSent) {
        return;
    }
    res.status(err?.status || 500).json({
        error: 'Internal Server Error',
        requestId: req.requestId || null
    });
});

// Handle interactions
client.on('interactionCreate', async interaction => {
    try {
        // Command interactions
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('Command execution error:', error);
                const content = {
                    content: 'An error occurred while executing this command.',
                    flags: MessageFlags.Ephemeral
                };

                try {
                    if (interaction.deferred || interaction.replied) {
                        await interaction.editReply(content);
                    } else {
                        await interaction.reply(content);
                    }
                } catch (responseError) {
                    if (responseError?.code !== 40060 && responseError?.code !== 10062) {
                        throw responseError;
                    }
                }
            }
        }

        // Modal submit interactions
        if (interaction.isModalSubmit() && interaction.customId === 'postcodeModal') {
            const command = client.commands.get('postcode');
            if (command?.modalSubmit) {
                try {
                    await command.modalSubmit(interaction);
                } catch (error) {
                    console.error('Modal submission error:', error);
                    const content = {
                        content: 'An error occurred while processing this submission.',
                        flags: MessageFlags.Ephemeral
                    };
                    try {
                        if (interaction.deferred || interaction.replied) {
                            await interaction.editReply(content);
                        } else {
                            await interaction.reply(content);
                        }
                    } catch (responseError) {
                        if (responseError?.code !== 40060 && responseError?.code !== 10062) {
                            throw responseError;
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Interaction error:', error);
    }
});

// Error handling for uncaught exceptions
process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
    void shutdown('UNCAUGHT_EXCEPTION', 1);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled Rejection:', error);
    void shutdown('UNHANDLED_REJECTION', 1);
});

let shuttingDown = false;
async function shutdown(signal, exitCode = 0) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    console.log(`Received ${signal}; shutting down bot...`);

    // Do not let a stuck HTTP socket or database disconnect prevent the shard
    // manager from replacing an unhealthy process.
    const forceExitTimer = setTimeout(() => process.exit(exitCode), 10_000);
    forceExitTimer.unref();

    selfMaintenance?.stop();
    if (presenceInterval) clearInterval(presenceInterval);
    if (codeCheckInterval) clearInterval(codeCheckInterval);
    if (yearCheckInterval) clearInterval(yearCheckInterval);
    stopLivestreamChecker();
    stopPostTracker();

    if (httpServer) {
        httpServer.closeIdleConnections?.();
        await new Promise(resolve => httpServer.close(resolve));
    }

    client.destroy();
    await mongoose.disconnect().catch(() => {});
    clearTimeout(forceExitTimer);
    process.exit(exitCode);
}

process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
});
process.once('SIGINT', () => {
    void shutdown('SIGINT');
});
