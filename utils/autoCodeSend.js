const axios = require('axios');
const Code = require('../models/Code');
const Config = require('../models/Config');
const Settings = require('../models/Settings');
const Language = require('../models/Language');
const languageManager = require('./language');
const { enrichCodesWithHoyolabRewards } = require('./codeRewardEnricher');
const { sendChannelMessage } = require('./discordMessageSender');
const { getKnownGuildIds, broadcastEvalWhenReady } = require('./clusterGuilds');
const { getHoyolabExchangeCodes, mergeExchangeCodes } = require('./hoyolabExchangeCodes');
const { shouldSendGameNotifications } = require('./notificationPreferences');
const { getRoleMention } = require('./roleMention');
const { reconcileConfiguredRoles } = require('./configuredRoles');
const { getLatestGuildRecords, countDuplicateGuildRecords } = require('./guildRecords');
const { GAME_EMOJIS } = require('./gameEmojis');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const gameNames = {
    'genshin': 'Genshin Impact',
    'hkrpg': 'Honkai: Star Rail',
    'nap': 'Zenless Zone Zero'
};

const redeemUrls = {
    'genshin': 'https://genshin.hoyoverse.com/en/gift',
    'hkrpg': 'https://hsr.hoyoverse.com/gift',
    'nap': 'https://zenless.hoyoverse.com/redemption'
};

const roleMapping = {
    'genshin': 'genshinRole',
    'hkrpg': 'hsrRole',
    'nap': 'zzzRole'
};

const settingsMapping = {
    'genshin': 'genshin',
    'hkrpg': 'hkrpg',
    'nap': 'nap'
};

const CURRENT_DELIVERY_VERSION = 2;
const DELIVERY_BATCH_SIZE = 40;
const DEFINITE_UNSENT_DISCORD_CODES = new Set([10003, 10008, 50001, 50013, 50035, 50083]);

let codeCheckRunning = false;
let embedBuildCounter = 0;
const DISCORD_EMBED_DESCRIPTION_LIMIT = 4096;

function normalizeCodeKey(game, code) {
    return `${game}:${String(code || '').trim().toUpperCase()}`;
}

function normalizeId(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function isDefiniteUnsentError(error) {
    if (!error) {
        return false;
    }
    if (DEFINITE_UNSENT_DISCORD_CODES.has(Number(error.code))) {
        return true;
    }
    const status = Number(error.status);
    return status >= 400 && status < 500 && status !== 408 && status !== 429;
}

// Concurrency limiter - processes promises in batches
async function processInBatches(tasks, batchSize) {
    const results = [];
    for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(batch.map(task => task.run()));
        results.push(...batchResults);
    }
    return results;
}

function getCodesToNotify(
    gameCodes,
    existingCodesMap
) {
    const selectedKeys = new Set();

    return gameCodes
        .filter(codeData => codeData.status === 'OK')
        .filter(codeData => {
            const key = normalizeCodeKey(codeData.game, codeData.code);
            if (existingCodesMap.has(key) || selectedKeys.has(key)) {
                return false;
            }
            selectedKeys.add(key);
            return true;
        });
}

async function insertCodeIfMissing(codeData, botId, CodeModel = Code) {
    try {
        await CodeModel.create({
            ...codeData,
            code: String(codeData.code || '').trim().toUpperCase(),
            timestamp: new Date(),
            notifiedBots: [],
            notifiedTargets: [],
            deliveryVersion: CURRENT_DELIVERY_VERSION,
            deliveryBots: [botId]
        });
        return true;
    } catch (error) {
        if (error?.code === 11000) {
            return false;
        }
        throw error;
    }
}

function getCodeNotificationTargetId(botId, guildId) {
    return `${botId}:guild:${guildId}`;
}

function getCodeDeliveryTargets(config, settings, game, botId) {
    const targets = [];
    const roleId = config[roleMapping[game]];
    const sendToChannel = settings?.autoSendOptions?.channel !== false;
    const sendToThreads = settings?.autoSendOptions?.threads !== false;
    const channelId = normalizeId(config.channel);

    if (sendToChannel && channelId) {
        targets.push({
            id: `${botId}:channel:${channelId}`,
            legacyId: getCodeNotificationTargetId(botId, config.guildId),
            guildId: config.guildId,
            channelId,
            type: 'channel',
            roleId,
            config
        });
    }

    const threadMapping = {
        genshin: config.forumThreads?.genshin,
        hkrpg: config.forumThreads?.hsr,
        nap: config.forumThreads?.zzz
    };
    const threadId = normalizeId(threadMapping[game]);
    if (sendToThreads && threadId && threadId !== channelId) {
        targets.push({
            id: `${botId}:thread:${threadId}`,
            legacyId: getCodeNotificationTargetId(botId, config.guildId),
            guildId: config.guildId,
            channelId: threadId,
            type: 'thread',
            roleId,
            config
        });
    }

    return targets;
}

function getPendingCodesForTarget(codes, existingCodesMap, targetId, legacyTargetId = null) {
    return codes.filter(codeData => {
        const existing = existingCodesMap.get(normalizeCodeKey(codeData.game, codeData.code));
        const notifiedTargets = existing?.notifiedTargets || [];
        return !notifiedTargets.includes(targetId)
            && (!legacyTargetId || !notifiedTargets.includes(legacyTargetId));
    });
}

async function claimCodeNotifications(game, codes, targetId, legacyTargetId = null) {
    const claimedCodes = [];
    const guardedTargetIds = legacyTargetId ? [targetId, legacyTargetId] : [targetId];

    for (const codeData of codes) {
        const normalizedCode = String(codeData.code || '').trim().toUpperCase();
        const claimed = await Code.findOneAndUpdate(
            {
                game,
                code: normalizedCode,
                notifiedTargets: { $nin: guardedTargetIds }
            },
            { $addToSet: { notifiedTargets: targetId } },
            { new: true }
        );
        if (claimed) {
            claimedCodes.push(codeData);
        }
    }

    return claimedCodes;
}

async function releaseCodeNotificationClaims(game, codes, targetId) {
    if (codes.length === 0) {
        return;
    }

    await Code.updateMany(
        {
            game,
            code: { $in: codes.map(code => String(code.code || '').trim().toUpperCase()) }
        },
        { $pull: { notifiedTargets: targetId } }
    );
}

function inspectShardChannelPermissions(shardClient, context) {
    const unwritable = [];

    for (const item of context.channels || []) {
        const guild = shardClient.guilds.cache.get(item.guildId) || null;
        const channel = shardClient.channels.cache.get(item.channelId)
            || guild?.channels?.cache?.get(item.channelId)
            || null;
        if (!channel) {
            // Discord always caches standard guild text/announcement channels for connected guilds.
            // If this shard owns the guild and the channel ID is missing, it was deleted (10003).
            if (guild && item.type === 'channel') {
                unwritable.push({ channelId: item.channelId, reason: 'missing_channel' });
            }
            continue;
        }

        if (!channel.isTextBased?.() || typeof channel.send !== 'function') {
            unwritable.push({ channelId: item.channelId, reason: 'not_sendable' });
            continue;
        }

        const resolvedGuild = guild || channel.guild || null;
        const botMember = resolvedGuild?.members?.me
            || resolvedGuild?.members?.cache?.get(shardClient.user?.id)
            || null;
        const permissions = botMember ? channel.permissionsFor(botMember) : null;
        const sendPermission = item.type === 'thread' ? 'SendMessagesInThreads' : 'SendMessages';

        if (permissions && !permissions.has(['ViewChannel', sendPermission, 'EmbedLinks'])) {
            unwritable.push({ channelId: item.channelId, reason: 'missing_permissions' });
        }
    }

    return unwritable;
}

async function findUnwritableCachedChannels(client, tasks) {
    if (!client?.shard?.broadcastEval || tasks.length === 0) {
        return new Map();
    }

    const uniqueChannels = new Map();
    for (const task of tasks) {
        if (!uniqueChannels.has(task.target.channelId)) {
            uniqueChannels.set(task.target.channelId, {
                channelId: task.target.channelId,
                guildId: task.target.guildId,
                type: task.target.type
            });
        }
    }

    try {
        const shardResults = await broadcastEvalWhenReady(
            client,
            inspectShardChannelPermissions,
            { context: { channels: [...uniqueChannels.values()] } }
        );
        return new Map(
            shardResults.flat().map(entry => [entry.channelId, entry.reason])
        );
    } catch (error) {
        console.warn('[Code Check] Could not pre-check shard channel permissions:', error.message);
        return new Map();
    }
}

async function checkAndSendNewCodes(client) {
    if (codeCheckRunning) {
        console.log('Skipping code check because the previous run is still active');
        return;
    }

    codeCheckRunning = true;
    console.log('Starting code check process...');
    const startTime = Date.now();
    const games = ['genshin', 'hkrpg', 'nap'];

    try {
        const botId = client.user?.id;
        if (!botId) {
            throw new Error('Cannot check codes before the bot is ready');
        }

        // Fast-path: fetch lightweight existing code metadata AND external APIs in parallel first.
        // Only query Config/Settings/Language (~8,500+ docs) and cross-shard guild lists when
        // new codes are actually discovered (avoids ~23s of wasted DB reads on idle 5-min ticks).
        const gameCodeRequests = games.map(game =>
            axios.get(`https://hoyo-codes.seria.moe/codes?game=${game}`, {
                timeout: 15000, // 15 second timeout
                headers: {
                    'User-Agent': 'HoYo-Code-Sender-Bot/1.0'
                }
            })
                .catch(error => {
                    console.error(`Error fetching codes for ${game}:`, error.message);
                    return { data: { codes: [] }, error: true };
                })
        );

        const [allExistingCodes, gameResponses] = await Promise.all([
            Code.find({}, { game: 1, code: 1, isExpired: 1 }).lean(),
            Promise.all(gameCodeRequests)
        ]);
        const existingCodesMap = new Map(
            allExistingCodes.map(code => [normalizeCodeKey(code.game, code.code), code])
        );

        await Promise.all(gameResponses.map(async (response, index) => {
            const game = games[index];
            const primaryCodesAreValid = Array.isArray(response.data?.codes);
            const primaryCodes = primaryCodesAreValid ? response.data.codes : [];
            response.expirationSafe = !response.error && primaryCodesAreValid;
            const hoyolabCodes = await getHoyolabExchangeCodes(game);
            response.data = response.data || {};
            response.data.codes = mergeExchangeCodes(
                game,
                primaryCodes,
                hoyolabCodes
            );
            response.data.codes = await enrichCodesWithHoyolabRewards(
                game,
                response.data?.codes || []
            );
        }));
        const newCodesForGames = {};
        const codesToSave = [];
        const activeCodesFromAPI = new Set();
        const failedGames = new Set();

        // Process all games' responses
        gameResponses.forEach((response, index) => {
            const game = games[index];

            // A partial source can still provide new codes, but is not authoritative
            // enough to expire codes that are absent from its response.
            if (!response.expirationSafe) {
                failedGames.add(game);
                console.log(`Skipping expiration check for ${game} because the primary API was unavailable or invalid`);
            }

            const gameCodes = response.data?.codes || [];

            // Track all active codes from API for expiration checking (only for successful requests)
            gameCodes.forEach(codeData => {
                if (codeData.status === 'OK') {
                    activeCodesFromAPI.add(normalizeCodeKey(codeData.game, codeData.code));
                }
            });

            if (gameCodes.length) {
                const activeCodes = gameCodes.filter(codeData => codeData.status === 'OK');
                const newCodes = getCodesToNotify(
                    gameCodes,
                    existingCodesMap,
                    botId
                );

                if (newCodes.length) {
                    newCodesForGames[game] = newCodes;
                }

                activeCodes
                    .filter(codeData => !existingCodesMap.has(normalizeCodeKey(codeData.game, codeData.code)))
                    .forEach(codeData => {
                        codesToSave.push({
                            game: codeData.game,
                            code: String(codeData.code || '').trim().toUpperCase(),
                            isExpired: false
                        });
                    });
            }
        });

        // Find codes that are no longer in API (expired)
        // Only check expiration for games where API request was successful
        const expiredCodes = allExistingCodes.filter(code =>
            !code.isExpired && // Only check codes that aren't already marked as expired
            !failedGames.has(code.game) && // Skip games with failed API requests
            !activeCodesFromAPI.has(normalizeCodeKey(code.game, code.code)) // Code not found in API response
        );

        // Find codes that were marked as expired but are now active again in API
        const reactivatedCodes = allExistingCodes.filter(code =>
            code.isExpired && // Only check codes that are currently marked as expired
            !failedGames.has(code.game) && // Skip games with failed API requests
            activeCodesFromAPI.has(normalizeCodeKey(code.game, code.code)) // Code found active in API response
        );

        // Batch operations
        const operations = [];

        let insertedCodes = [];

        // Save first. Only the process that wins the unique DB insert may notify.
        if (codesToSave.length > 0) {
            const insertResults = await Promise.all(codesToSave.map(
                codeData => insertCodeIfMissing(codeData, botId)
            ));
            insertedCodes = codesToSave.filter((codeData, index) => insertResults[index]);
        }

        const insertedCodeKeys = new Set(
            insertedCodes.map(code => normalizeCodeKey(code.game, code.code))
        );
        for (const game of Object.keys(newCodesForGames)) {
            newCodesForGames[game] = newCodesForGames[game].filter(
                code => insertedCodeKeys.has(normalizeCodeKey(code.game, code.code))
            );
            if (newCodesForGames[game].length === 0) {
                delete newCodesForGames[game];
            }
        }

        // Mark expired codes
        if (expiredCodes.length > 0) {
            const expiredCodeIds = expiredCodes.map(code => code._id);
            operations.push(
                Code.updateMany(
                    { _id: { $in: expiredCodeIds } },
                    { $set: { isExpired: true } }
                )
            );
            console.log(`Marking ${expiredCodes.length} codes as expired:`,
                expiredCodes.map(c => `${c.game}:${c.code}`));
        } else {
            console.log('No codes to mark as expired');
        }

        // Reactivate codes that were marked as expired but are now active again
        if (reactivatedCodes.length > 0) {
            const reactivatedCodeIds = reactivatedCodes.map(code => code._id);
            operations.push(
                Code.updateMany(
                    { _id: { $in: reactivatedCodeIds } },
                    { $set: { isExpired: false } }
                )
            );
            console.log(`Reactivating ${reactivatedCodes.length} codes (marking as active):`,
                reactivatedCodes.map(c => `${c.game}:${c.code}`));
        } else {
            console.log('No codes to reactivate');
        }

        // Log API status for transparency
        if (failedGames.size > 0) {
            console.log(`API request failed for games: ${Array.from(failedGames).join(', ')}`);
            console.log('Skipped expiration check for failed games to prevent false positives');
        }

        // Execute all database operations
        if (operations.length > 0) {
            await Promise.all(operations);
        }

        // ===== OPTIMIZED MESSAGE SENDING =====
        // If no new codes, exit immediately without loading Config/Settings/Language or polling shards
        if (Object.keys(newCodesForGames).length === 0) {
            console.log(`Code check completed in ${Date.now() - startTime}ms (${allExistingCodes.length} existing codes). No new codes found.`);
            return;
        }

        // Load guild configurations, settings, languages, and connected guild IDs ONLY when broadcasting new codes
        const [rawConfigs, rawSettings, languages, knownGuildIds] = await Promise.all([
            Config.find({}, {
                guildId: 1,
                channel: 1,
                forumThreads: 1,
                genshinRole: 1,
                hsrRole: 1,
                zzzRole: 1,
                notifications: 1
            }).sort({ _id: 1 }).lean(),
            Settings.find({}, {
                guildId: 1,
                autoSendEnabled: 1,
                autoSendOptions: 1,
                favoriteGames: 1
            }).sort({ _id: 1 }).lean(),
            Language.find({}, { guildId: 1, language: 1 }).lean(),
            getKnownGuildIds(client)
        ]);
        const configs = getLatestGuildRecords(rawConfigs);
        const allSettings = getLatestGuildRecords(rawSettings);
        const duplicateConfigs = countDuplicateGuildRecords(rawConfigs);
        const duplicateSettings = countDuplicateGuildRecords(rawSettings);
        if (duplicateConfigs || duplicateSettings) {
            console.warn(
                `[Code Check] Ignoring duplicate DB rows: ${duplicateConfigs} config, `
                + `${duplicateSettings} settings (newest row per guild wins)`
            );
        }
        console.log(`Code check: ${insertedCodes.length} new code(s), ${configs.length} configured / ${knownGuildIds.size} known guilds`);

        // Create lookup maps to avoid repeated database queries
        const settingsMap = allSettings.reduce((map, setting) => {
            map[setting.guildId] = setting;
            return map;
        }, {});

        const languageMap = languages.reduce((map, lang) => {
            map[lang.guildId] = lang;
            return map;
        }, {});

        // Pre-populate language cache from batch-fetched data to avoid per-guild DB queries
        for (const lang of languages) {
            languageManager.languageCache.set(lang.guildId, {
                language: lang.language,
                timestamp: Date.now()
            });
        }

        // Pre-build embeds per (game, language) to avoid rebuilding identical embeds for 2500+ guilds
        const uniqueLanguages = new Set(['en']); // Always include English as default
        for (const lang of languages) {
            if (lang.language) uniqueLanguages.add(lang.language);
        }

        // Build embed cache: key = `${game}:${lang}` → { embed, supportMsg }
        const embedCache = new Map();

        const embedBuildPromises = [];
        for (const game of Object.keys(newCodesForGames)) {
            for (const lang of uniqueLanguages) {
                embedBuildPromises.push(
                    buildEmbedForGameAndLang(game, lang, newCodesForGames[game])
                        .then(result => {
                            embedCache.set(`${game}:${lang}`, result);
                        })
                );
            }
        }
        await Promise.all(embedBuildPromises);

        console.log(`Pre-built ${embedCache.size} embed(s) for ${Object.keys(newCodesForGames).length} game(s) × ${uniqueLanguages.size} language(s)`);

        // Only reconcile configs that are currently missing a role ID on the hot send path
        // (full reconciliation already runs on startup).
        for (const game of Object.keys(newCodesForGames)) {
            const roleField = roleMapping[game];
            const missingRoleConfigs = configs.filter(config => {
                if (config[roleField]) {
                    return false;
                }
                const settings = settingsMap[config.guildId];
                return knownGuildIds.has(config.guildId)
                    && shouldSendGameNotifications(settings, game)
                    && getCodeDeliveryTargets(config, settings, game, botId).length > 0;
            });
            if (missingRoleConfigs.length > 0) {
                await reconcileConfiguredRoles(client, missingRoleConfigs, game);
            }
        }

        // Prepare message sending tasks as lazy functions (not yet executing)
        const messageTasks = new Map();
        let skippedNotInGuild = 0;
        let skippedAutoSendOff = 0;
        // Filter configs that have autoSend enabled
        for (const config of configs) {
            const guildId = config.guildId;
            const settings = settingsMap[guildId];

            if (!knownGuildIds.has(guildId)) {
                skippedNotInGuild++;
                continue;
            }

            // Process each game with new codes
            for (const game in newCodesForGames) {
                if (!shouldSendGameNotifications(settings, game)) {
                    skippedAutoSendOff++;
                    continue;
                }

                const codes = newCodesForGames[game];
                const deliveryTargets = getCodeDeliveryTargets(config, settings, game, botId);
                for (const target of deliveryTargets) {
                    const pendingCodes = getPendingCodesForTarget(
                        codes,
                        existingCodesMap,
                        target.id,
                        target.legacyId
                    );
                    if (pendingCodes.length === 0) {
                        continue;
                    }

                    // Determine guild language for embed lookup
                    const guildLangCode = languageMap[guildId]?.language || 'en';
                    const cachedEmbed = embedCache.get(`${game}:${guildLangCode}`) || embedCache.get(`${game}:en`);

                    messageTasks.set(`${game}:${target.id}`, {
                        game,
                        codes: pendingCodes,
                        target,
                        targetId: target.id,
                        guildLangCode,
                        cachedEmbed
                    });
                }
            }
        }

        const rawQueuedTasks = [...messageTasks.values()];
        const unwritableChannels = await findUnwritableCachedChannels(client, rawQueuedTasks);

        const queuedTasks = rawQueuedTasks.map(task => ({
            ...task,
            run: async () => {
                const unwritableReason = unwritableChannels.get(task.target.channelId);
                if (unwritableReason) {
                    console.warn(
                        `[sendNotif] Skip ${task.target.guildId}/${task.target.channelId} `
                        + `(${task.target.type}): ${unwritableReason}`
                    );
                    return false;
                }

                const claimedCodes = await claimCodeNotifications(
                    task.game,
                    task.codes,
                    task.target.id,
                    task.target.legacyId
                );
                if (claimedCodes.length === 0) {
                    return false;
                }

                try {
                    const claimedEmbed = claimedCodes.length === task.codes.length
                        ? task.cachedEmbed
                        : await buildEmbedForGameAndLang(
                            task.game,
                            task.guildLangCode,
                            claimedCodes
                        );
                    const delivery = await sendCodeNotificationTarget(
                        client,
                        task.target,
                        task.game,
                        claimedCodes,
                        claimedEmbed
                    );
                    if (!delivery.sent && delivery.definiteUnsent) {
                        await releaseCodeNotificationClaims(
                            task.game,
                            claimedCodes,
                            task.target.id
                        );
                    }
                    return delivery.sent;
                } catch (error) {
                    if (isDefiniteUnsentError(error)) {
                        await releaseCodeNotificationClaims(
                            task.game,
                            claimedCodes,
                            task.target.id
                        );
                    }
                    throw error;
                }
            }
        }));

        const matchingConfiguredGuilds = configs.length - skippedNotInGuild;
        if (configs.length > 0 && matchingConfiguredGuilds === 0) {
            console.error(
                `[Code Check] None of the ${configs.length} configured guild(s) belong to `
                + `${client.user.tag} (${botId}). Check DISCORD_TOKEN, CLIENT_ID, and whether `
                + 'this bot has been set up in its test guild.'
            );
        }
        console.log(`Task summary: ${queuedTasks.length} to send, ${skippedNotInGuild} guilds not found, ${skippedAutoSendOff} auto-send disabled`);
        if (queuedTasks.length > 0) {
            console.log(`Sending notifications to ${queuedTasks.length} channel/thread target(s) in batches of ${DELIVERY_BATCH_SIZE}...`);
            const results = await processInBatches(queuedTasks, DELIVERY_BATCH_SIZE);
            const successCount = results.filter(
                result => result.status === 'fulfilled' && result.value === true
            ).length;
            console.log(`Code notifications delivered to ${successCount}/${queuedTasks.length} targets`);
        }

        const elapsed = Date.now() - startTime;
        console.log(`Code check process completed in ${elapsed}ms. Found ${insertedCodes.length} new codes, ${expiredCodes.length} expired codes, ${reactivatedCodes.length} reactivated codes. Queued ${queuedTasks.length} targets.`);
    } catch (error) {
        console.error('Error in checkAndSendNewCodes:', error);
    } finally {
        codeCheckRunning = false;
    }
}

// Pre-build embed content for a specific game + language combination
async function buildEmbedForGameAndLang(game, lang, codes) {
    // Use a unique synthetic guildId per call so concurrent builds for the same
    // language never delete each other's temporary languageCache entry.
    const fakeGuildId = `__embed_build_${game}_${lang}_${++embedBuildCounter}`;
    languageManager.languageCache.set(fakeGuildId, {
        language: lang,
        timestamp: Date.now()
    });

    try {
        const baseTitle = await languageManager.getString(
            'commands.listcodes.newCodes',
            fakeGuildId,
            { game: gameNames[game] }
        );
        const title = `${GAME_EMOJIS[game]} ${baseTitle}`;

        const redeemText = await languageManager.getString(
            'commands.listcodes.redeemButton',
            fakeGuildId
        );

        const descriptionPromises = codes.map(async code => {
            const rewardString = code.rewards ?
                await languageManager.getRewardString(code.rewards, fakeGuildId) :
                await languageManager.getString('commands.listcodes.noReward', fakeGuildId);

            return `**${code.code}**\n[${redeemText}](${redeemUrls[game]}?code=${encodeURIComponent(code.code)})\n└ ${rewardString}`;
        });

        const descriptions = await Promise.all(descriptionPromises);
        let finalDescription = descriptions.join('\n\n');
        if (finalDescription.length > DISCORD_EMBED_DESCRIPTION_LIMIT) {
            finalDescription = `${finalDescription.slice(0, DISCORD_EMBED_DESCRIPTION_LIMIT - 3)}...`;
        }

        const supportMsg = await languageManager.getSupportFooter(fakeGuildId);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle(title)
            .setDescription(finalDescription)
            .setFooter({ text: supportMsg })
            .setTimestamp();

        return { embed, supportMsg };
    } finally {
        // Clean up fake guild from cache
        languageManager.languageCache.delete(fakeGuildId);
    }
}

async function sendCodeNotificationTarget(client, target, game, codes, cachedEmbed) {
    const { guildId, channelId, type, roleId, config } = target;
    if (!guildId || !codes?.length) {
        console.log(`[sendNotif] Skip ${guildId}: missing guildId or codes`);
        return { sent: false, definiteUnsent: true };
    }

    try {
        const channel = client.channels.cache.get(channelId);
        const guild = client.guilds.cache.get(guildId) || channel?.guild || null;
        const botMember = guild?.members?.me
            || guild?.members?.cache?.get(client.user.id)
            || null;
        if (channel) {
            if (!channel.isTextBased?.() || typeof channel.send !== 'function') {
                console.warn(`[sendNotif] ${guildId}/${channelId} is not a sendable text channel`);
                return { sent: false, definiteUnsent: true };
            }

            const permissions = botMember ? channel.permissionsFor(botMember) : null;
            const sendPermission = type === 'thread'
                ? PermissionFlagsBits.SendMessagesInThreads
                : PermissionFlagsBits.SendMessages;
            if (permissions && !permissions.has([
                PermissionFlagsBits.ViewChannel,
                sendPermission,
                PermissionFlagsBits.EmbedLinks
            ])) {
                console.warn(`[sendNotif] Missing permissions for ${guildId}/${channelId} (${type})`);
                return { sent: false, definiteUnsent: true };
            }
        }

        const roleMention = getRoleMention(roleId);
        const dedupeKey = `code:${game}:${channelId}:${codes
            .map(code => String(code.code || '').trim().toUpperCase())
            .sort()
            .join(',')}`;

        await sendChannelMessage(client, channelId, {
            content: roleMention.content,
            embeds: [cachedEmbed.embed],
            allowedMentions: roleMention.allowedMentions
        }, {
            preferRest: true,
            guildId,
            dedupeKey
        });
        return { sent: true, definiteUnsent: false };

    } catch (error) {
        console.error(
            `[sendNotif] Failed ${guildId}/${channelId} (${type}) for ${game} `
            + `[${codes.map(code => code.code).join(', ')}]:`,
            error.code || error.message
        );
        // Handle specific Discord API errors silently
        if (error.code === 50001 || error.code === 50013) {
            // Missing Access (50001) or Missing Permissions (50013)
            const guild = client.guilds.cache.get(guildId);
            if (guild) {
                await notifyGuildOwnerMissingPermissions(client, guild, config, 'SendMessages');
            }
            return { sent: false, definiteUnsent: true };
        }

        if (error.code === 10003) {
            // Unknown Channel - channel was deleted
            const guild = client.guilds.cache.get(guildId);
            if (guild) {
                await notifyGuildOwnerMissingChannel(client, guild, config);
            }
            return { sent: false, definiteUnsent: true };
        }

        // Only treat unambiguous 4xx rejections as definitely unsent; timeouts/5xx may have succeeded.
        return { sent: false, definiteUnsent: isDefiniteUnsentError(error) };
    }
}

// Helper function to notify guild owner about missing channel (only once)
async function notifyGuildOwnerMissingChannel(client, guild, config) {
    try {
        // Check if we've already notified about this issue
        if (config.notifications?.channelMissing?.notified) {
            return; // Already notified, don't spam
        }

        const owner = await guild.fetchOwner();
        if (!owner || !owner.user) return;

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('⚠️ HoYo Code Sender - Channel Issue')
            .setDescription(`The notification channel in **${guild.name}** has been deleted or is no longer accessible.`)
            .addFields(
                { name: 'Action Required', value: 'Please run `/setup` again to configure a new notification channel.' },
                { name: 'Server', value: guild.name, inline: true },
                { name: 'Server ID', value: guild.id, inline: true }
            )
            .setFooter({ text: 'HoYo Code Sender Bot' })
            .setTimestamp();

        await owner.send({ embeds: [embed] });

        // Mark as notified on the active config document to prevent future spam
        const updatePayload = {
            $set: {
                'notifications.channelMissing.notified': true,
                'notifications.channelMissing.lastNotified': new Date()
            }
        };
        if (config._id) {
            await Config.updateOne({ _id: config._id }, updatePayload);
        } else {
            await Config.findOneAndUpdate(
                { guildId: guild.id },
                updatePayload,
                { sort: { _id: -1 } }
            );
        }
    } catch (error) {
        // Silently handle DM errors (user might have DMs disabled)
    }
}

// Helper function to notify guild owner about missing permissions (only once per permission)
async function notifyGuildOwnerMissingPermissions(client, guild, config, permission) {
    try {
        // Check if we've already notified about this specific permission issue
        if (config.notifications?.permissionMissing?.notified &&
            config.notifications?.permissionMissing?.permission === permission) {
            return; // Already notified about this permission, don't spam
        }

        const owner = await guild.fetchOwner();
        if (!owner || !owner.user) return;

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('⚠️ HoYo Code Sender - Permission Issue')
            .setDescription(`The bot is missing the **${permission}** permission in **${guild.name}**.`)
            .addFields(
                { name: 'Action Required', value: 'Please grant the bot the required permissions or run `/setup` again.' },
                { name: 'Missing Permission', value: permission, inline: true },
                { name: 'Server', value: guild.name, inline: true },
                { name: 'Server ID', value: guild.id, inline: true }
            )
            .setFooter({ text: 'HoYo Code Sender Bot' })
            .setTimestamp();

        await owner.send({ embeds: [embed] });

        // Mark as notified on the active config document to prevent future spam
        const updatePayload = {
            $set: {
                'notifications.permissionMissing.notified': true,
                'notifications.permissionMissing.lastNotified': new Date(),
                'notifications.permissionMissing.permission': permission
            }
        };
        if (config._id) {
            await Config.updateOne({ _id: config._id }, updatePayload);
        } else {
            await Config.findOneAndUpdate(
                { guildId: guild.id },
                updatePayload,
                { sort: { _id: -1 } }
            );
        }
    } catch (error) {
        // Silently handle DM errors (user might have DMs disabled)
    }
}

module.exports = {
    checkAndSendNewCodes,
    buildEmbedForGameAndLang,
    getCodesToNotify,
    insertCodeIfMissing,
    getCodeNotificationTargetId,
    getPendingCodesForTarget,
    getCodeDeliveryTargets,
    inspectShardChannelPermissions,
    isDefiniteUnsentError
};
