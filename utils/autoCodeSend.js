const axios = require('axios');
const Code = require('../models/Code');
const Config = require('../models/Config');
const Settings = require('../models/Settings');
const Language = require('../models/Language');
const languageManager = require('./language');
const { enrichCodesWithHoyolabRewards } = require('./codeRewardEnricher');
const { sendChannelMessage } = require('./discordMessageSender');
const { getKnownGuildIds } = require('./clusterGuilds');
const { getHoyolabExchangeCodes, mergeExchangeCodes } = require('./hoyolabExchangeCodes');
const { shouldSendGameNotifications } = require('./notificationPreferences');
const { getRoleMention } = require('./roleMention');
const { getLatestGuildRecords, countDuplicateGuildRecords } = require('./guildRecords');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const gameNames = {
    'genshin': 'Genshin Impact',
    'hkrpg': 'Honkai: Star Rail',
    'nap': 'Zenless Zone Zero'
};

const gameEmojis = {
    'genshin': '<:genshin:1368073403231375430>',
    'hkrpg': '<:hsr:1368073099756703794>',
    'nap': '<:zzz:1368073452174704763>'
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

// Support links for donations
const supportLinks = {
    kofi: 'https://ko-fi.com/chiraitori',
    sponsors: 'https://github.com/sponsors/chiraitori',
    paypal: 'https://paypal.me/chiraitori',
    banking: 'Use /about command for Vietnamese banking details'
};

let codeCheckRunning = false;

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

function getCodesToNotify(gameCodes, existingCodesMap, botId) {
    return gameCodes
        .filter(codeData => codeData.status === 'OK')
        .filter(codeData => {
            const existing = existingCodesMap.get(`${codeData.game}:${codeData.code}`);
            if (!existing) {
                return true;
            }
            if (existing.notifiedBots?.includes(botId)) {
                return false;
            }

            // Legacy migration guard: if the record predates the notifiedBots field,
            // it will have neither notifiedBots nor an empty array. Skip those to
            // avoid replaying ancient codes after a schema migration.
            if (!Array.isArray(existing.notifiedBots)) {
                return false;
            }

            // Code exists, this bot hasn't notified it yet, and it has the modern
            // schema → always retry regardless of age.
            return true;
        });
}

function getCodeNotificationTargetId(botId, guildId) {
    return `${botId}:guild:${guildId}`;
}

function getCodeDeliveryTargets(config, settings, game, botId) {
    const targets = [];
    const roleId = config[roleMapping[game]];
    const sendToChannel = settings?.autoSendOptions?.channel !== false;
    const sendToThreads = settings?.autoSendOptions?.threads !== false;

    if (sendToChannel && config.channel) {
        targets.push({
            id: `${botId}:channel:${config.channel}`,
            legacyId: getCodeNotificationTargetId(botId, config.guildId),
            guildId: config.guildId,
            channelId: config.channel,
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
    const threadId = threadMapping[game];
    if (sendToThreads && threadId) {
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
        const existing = existingCodesMap.get(`${codeData.game}:${codeData.code}`);
        const notifiedTargets = existing?.notifiedTargets || [];
        return !notifiedTargets.includes(targetId)
            && (!legacyTargetId || !notifiedTargets.includes(legacyTargetId));
    });
}

async function claimCodeNotifications(game, codes, targetId) {
    const claimedCodes = [];

    for (const codeData of codes) {
        const claimed = await Code.findOneAndUpdate(
            {
                game,
                code: codeData.code,
                notifiedTargets: { $ne: targetId }
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
        { game, code: { $in: codes.map(code => code.code) } },
        { $pull: { notifiedTargets: targetId } }
    );
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
        // Fetch all configurations, settings, and languages in parallel once
        const [rawConfigs, rawSettings, languages] = await Promise.all([
            Config.find({}).sort({ _id: 1 }).lean(),
            Settings.find({}).sort({ _id: 1 }).lean(),
            Language.find({}).lean()
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

        const botId = client.user?.id;
        if (!botId) {
            throw new Error('Cannot check codes before the bot is ready');
        }

        // Batch fetch all existing codes
        const allExistingCodes = await Code.find({}).lean();
        const existingCodesMap = new Map(
            allExistingCodes.map(code => [`${code.game}:${code.code}`, code])
        );
        const knownGuildIds = await getKnownGuildIds(client);
        console.log(`Code check: ${allExistingCodes.length} existing codes in DB, ${knownGuildIds.size} known guilds`);

        // Fetch all games' codes in parallel
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

        const gameResponses = await Promise.all(gameCodeRequests);

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
                    activeCodesFromAPI.add(`${codeData.game}:${codeData.code}`);
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
                    console.log(`[${game}] ${newCodes.length} new code(s) to notify: ${newCodes.map(c => c.code).join(', ')}`);
                }

                activeCodes
                    .filter(codeData => !existingCodesMap.has(`${codeData.game}:${codeData.code}`))
                    .forEach(codeData => {
                        codesToSave.push({
                            game: codeData.game,
                            code: codeData.code,
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
            !activeCodesFromAPI.has(`${code.game}:${code.code}`) // Code not found in API response
        );

        // Find codes that were marked as expired but are now active again in API
        const reactivatedCodes = allExistingCodes.filter(code => 
            code.isExpired && // Only check codes that are currently marked as expired
            !failedGames.has(code.game) && // Skip games with failed API requests
            activeCodesFromAPI.has(`${code.game}:${code.code}`) // Code found active in API response
        );

        // Batch operations
        const operations = [];
        
        // Add new codes
        if (codesToSave.length > 0) {
            operations.push(Code.bulkWrite(codesToSave.map(codeData => ({
                updateOne: {
                    filter: { game: codeData.game, code: codeData.code },
                    update: {
                        $setOnInsert: {
                            ...codeData,
                            timestamp: new Date(),
                            notifiedBots: [],
                            notifiedTargets: []
                        }
                    },
                    upsert: true
                }
            })), { ordered: false }));
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
        // If no new codes, skip all message sending logic
        if (Object.keys(newCodesForGames).length === 0) {
            console.log(`Code check completed in ${Date.now() - startTime}ms. No new codes found.`);
            return;
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
                        targetId: target.id,
                        run: async () => {
                            const claimedCodes = await claimCodeNotifications(
                                game,
                                pendingCodes,
                                target.id
                            );
                            if (claimedCodes.length === 0) {
                                return false;
                            }

                            try {
                                const claimedEmbed = claimedCodes.length === pendingCodes.length
                                    ? cachedEmbed
                                    : await buildEmbedForGameAndLang(
                                        game,
                                        guildLangCode,
                                        claimedCodes
                                    );
                                const sent = await sendCodeNotificationTarget(
                                    client,
                                    target,
                                    game,
                                    claimedCodes,
                                    claimedEmbed
                                );
                                if (!sent) {
                                    await releaseCodeNotificationClaims(
                                        game,
                                        claimedCodes,
                                        target.id
                                    );
                                }
                                return sent;
                            } catch (error) {
                                await releaseCodeNotificationClaims(
                                    game,
                                    claimedCodes,
                                    target.id
                                );
                                throw error;
                            }
                        }
                    });
                }
            }
        }

        // Execute message sends in batches of 50 for rate-limit safety at 2500+ guilds
        // Discord global rate limit is 50 requests/second, so batches of 50 with natural async gaps work well
        const queuedTasks = [...messageTasks.values()];
        console.log(`Task summary: ${queuedTasks.length} to send, ${skippedNotInGuild} guilds not found, ${skippedAutoSendOff} auto-send disabled`);
        if (queuedTasks.length > 0) {
            console.log(`Sending notifications to ${queuedTasks.length} channel/thread target(s) in batches of 50...`);
            const results = await processInBatches(queuedTasks, 50);
            const successCount = results.filter(
                result => result.status === 'fulfilled' && result.value === true
            ).length;
            console.log(`Code notifications delivered to ${successCount}/${queuedTasks.length} targets`);
        }
        
        const elapsed = Date.now() - startTime;
        console.log(`Code check process completed in ${elapsed}ms. Found ${codesToSave.length} new codes, ${expiredCodes.length} expired codes, ${reactivatedCodes.length} reactivated codes. Queued ${queuedTasks.length} targets.`);
    } catch (error) {
        console.error('Error in checkAndSendNewCodes:', error);
    } finally {
        codeCheckRunning = false;
    }
}

// Pre-build embed content for a specific game + language combination
async function buildEmbedForGameAndLang(game, lang, codes) {
    // Temporarily set a fake guildId in language cache so getString uses this language
    const fakeGuildId = `__embed_build_${lang}`;
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
        const title = `${gameEmojis[game]} ${baseTitle}`;

        const redeemText = await languageManager.getString(
            'commands.listcodes.redeemButton',
            fakeGuildId
        );

        const descriptionPromises = codes.map(async code => {
            const rewardString = code.rewards ? 
                await languageManager.getRewardString(code.rewards, fakeGuildId) : 
                await languageManager.getString('commands.listcodes.noReward', fakeGuildId);
            
            return `**${code.code}**\n[${redeemText}](${redeemUrls[game]}?code=${code.code})\n└ ${rewardString}`;
        });

        const descriptions = await Promise.all(descriptionPromises);
        const finalDescription = descriptions.join('\n\n');

        const supportMsg = await languageManager.getString(
            'common.supportMsg', 
            fakeGuildId
        ) || '❤️ Support: ko-fi.com/chiraitori | paypal.me/chiraitori | github.com/sponsors/chiraitori';

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
        return false;
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
                return false;
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
                return false;
            }
        }

        const roleMention = getRoleMention(roleId);
        await sendChannelMessage(client, channelId, {
            content: roleMention.content,
            embeds: [cachedEmbed.embed],
            allowedMentions: roleMention.allowedMentions
        });
        return true;

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
            return false;
        }

        if (error.code === 10003) {
            // Unknown Channel - channel was deleted
            const guild = client.guilds.cache.get(guildId);
            if (guild) {
                await notifyGuildOwnerMissingChannel(client, guild, config);
            }
            return false;
        }

        // For other errors, fail silently
        return false;
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

        // Mark as notified to prevent future spam
        await Config.updateOne(
            { guildId: guild.id },
            { 
                $set: { 
                    'notifications.channelMissing.notified': true,
                    'notifications.channelMissing.lastNotified': new Date()
                }
            }
        );
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

        // Mark as notified to prevent future spam
        await Config.updateOne(
            { guildId: guild.id },
            { 
                $set: { 
                    'notifications.permissionMissing.notified': true,
                    'notifications.permissionMissing.lastNotified': new Date(),
                    'notifications.permissionMissing.permission': permission
                }
            }
        );
    } catch (error) {
        // Silently handle DM errors (user might have DMs disabled)
    }
}

module.exports = {
    checkAndSendNewCodes,
    getCodesToNotify,
    getCodeNotificationTargetId,
    getPendingCodesForTarget,
    getCodeDeliveryTargets
};
