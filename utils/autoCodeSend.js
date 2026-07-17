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
        const [configs, allSettings, languages] = await Promise.all([
            Config.find({}).lean(),
            Settings.find({}).lean(),
            Language.find({}).lean()
        ]);

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
            if (response.error) {
                return;
            }

            const game = games[index];
            const hoyolabCodes = await getHoyolabExchangeCodes(game);
            response.data.codes = mergeExchangeCodes(
                game,
                response.data?.codes || [],
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
            
            // If there was an error fetching this game's codes, skip expiration check for this game
            if (response.error) {
                failedGames.add(game);
                console.log(`Skipping expiration check for ${game} due to API error`);
                return;
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
                            notifiedBots: []
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
        const messageTasks = [];
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
                if (codes.length > 0) {
                    // Determine guild language for embed lookup
                    const guildLangCode = languageMap[guildId]?.language || 'en';
                    const cachedEmbed = embedCache.get(`${game}:${guildLangCode}`) || embedCache.get(`${game}:en`);

                    // Push as a lazy function (not yet invoked) for batched execution
                    messageTasks.push({
                        game,
                        codes,
                        run: () => sendCodeNotification(
                            client,
                            config,
                            settings,
                            game,
                            codes,
                            guildId,
                            cachedEmbed
                        )
                    });
                }
            }
        }

        // Execute message sends in batches of 50 for rate-limit safety at 2500+ guilds
        // Discord global rate limit is 50 requests/second, so batches of 50 with natural async gaps work well
        console.log(`Task summary: ${messageTasks.length} to send, ${skippedNotInGuild} guilds not found, ${skippedAutoSendOff} auto-send disabled`);
        if (messageTasks.length > 0) {
            console.log(`Sending notifications to ${messageTasks.length} guild-game combination(s) in batches of 50...`);
            const results = await processInBatches(messageTasks, 50);
            const successfulCodesByGame = new Map();

            results.forEach((result, index) => {
                if (result.status !== 'fulfilled' || result.value !== true) {
                    return;
                }

                const task = messageTasks[index];
                const codeSet = successfulCodesByGame.get(task.game) || new Set();
                task.codes.forEach(code => codeSet.add(code.code));
                successfulCodesByGame.set(task.game, codeSet);
            });

            await Promise.all([...successfulCodesByGame].map(([game, codes]) =>
                Code.updateMany(
                    { game, code: { $in: [...codes] } },
                    { $addToSet: { notifiedBots: botId } }
                )
            ));
        }
        
        const elapsed = Date.now() - startTime;
        console.log(`Code check process completed in ${elapsed}ms. Found ${codesToSave.length} new codes, ${expiredCodes.length} expired codes, ${reactivatedCodes.length} reactivated codes. Sent to ${messageTasks.length} targets.`);
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

async function sendCodeNotification(client, config, settings, game, codes, guildId, cachedEmbed) {
    if (!guildId || !codes?.length) {
        console.log(`[sendNotif] Skip ${guildId}: missing guildId or codes`);
        return false;
    }

    let sent = false;
    try {
        // Check auto-send options (default to true if not set)
        const sendToChannel = settings?.autoSendOptions?.channel !== false;
        const sendToThreads = settings?.autoSendOptions?.threads !== false;
        
        // If both are disabled, skip (shouldn't happen, but safety check)
        if (!sendToChannel && !sendToThreads) {
            console.log(`[sendNotif] Skip ${guildId}: both channel and threads disabled`);
            return false;
        }

        // Validate channel if sending to it
        const channel = sendToChannel ? client.channels.cache.get(config.channel) : null;
        if (sendToChannel) {
            // Check if channel is text-based
            if (channel && !channel.isTextBased()) {
                return false;
            }

            // Check if channel.send is a function
            if (channel && typeof channel.send !== 'function') {
                return false;
            }
        }

        const guild = client.guilds.cache.get(guildId) || channel?.guild || null;
        const botMember = guild?.members?.me
            || guild?.members?.cache?.get(client.user.id)
            || null;
        
        // Validate cached permissions when available. Discord still validates every send.
        let canSendToChannel = sendToChannel && Boolean(config.channel);
        if (sendToChannel && channel && botMember) {
            const channelPermissions = channel.permissionsFor(botMember);
            if (!channelPermissions || !channelPermissions.has(PermissionFlagsBits.SendMessages)) {
                canSendToChannel = false;
            } else if (!channelPermissions.has(PermissionFlagsBits.EmbedLinks)) {
                canSendToChannel = false;
            }
            // If we reach here without setting to false, canSendToChannel remains true
        }
        
        // If neither channel nor threads can receive, exit early
        if (!canSendToChannel && !sendToThreads) {
            console.log(`[sendNotif] Skip ${guildId}: no channel permission and threads disabled`);
            return false;
        }

        // Use the pre-built embed from cache instead of rebuilding
        const embed = cachedEmbed.embed;

        // Prepare message content with proper role mentions
        const roleField = roleMapping[game];
        const roleId = config[roleField];
        let content = '';
        let allowedMentions = {};

        if (roleId) {
            content = `<@&${roleId}>`;
            // Check role mention permissions (only if we have a channel to check)
            if (channel && botMember) {
                const channelPermissions = channel.permissionsFor(botMember);
                if (channelPermissions && channelPermissions.has(PermissionFlagsBits.MentionEveryone)) {
                    allowedMentions = {
                        roles: [roleId]
                    };
                } else {
                    // Can't mention roles, just send without mentions
                    content = '';
                    allowedMentions = {
                        roles: []
                    };
                }
            } else {
                // No channel to check permissions, allow mentions for threads
                allowedMentions = {
                    roles: [roleId]
                };
            }
        }

        // Send the message to main channel (if enabled and has permissions)
        if (canSendToChannel && config.channel) {
            await sendChannelMessage(client, config.channel, {
                content: content, 
                embeds: [embed],
                allowedMentions: allowedMentions
            });
            sent = true;
        }
        
        // Also send to dedicated forum thread for this game if configured (if enabled)
        if (sendToThreads && config.forumThreads) {
            try {
                // Map game IDs to thread keys
                const threadMapping = {
                    'genshin': 'genshin',
                    'hkrpg': 'hsr',
                    'nap': 'zzz'
                };
                
                const threadKey = threadMapping[game];
                const threadId = config.forumThreads[threadKey];
                
                if (threadId) {
                    const forumThread = client.channels.cache.get(threadId);
                    if (!forumThread) {
                        await sendChannelMessage(client, threadId, {
                            content: config[roleMapping[game]]
                                ? `<@&${config[roleMapping[game]]}>`
                                : '',
                            embeds: [embed],
                            allowedMentions: {
                                roles: config[roleMapping[game]]
                                    ? [config[roleMapping[game]]]
                                    : []
                            }
                        });
                        sent = true;
                    } else {
                        const { ChannelType } = require('discord.js');
                        // Verify it's actually a thread
                        if ([ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.AnnouncementThread].includes(forumThread.type)) {
                            // Use already-resolved botMember from cache instead of fetching from API
                            const threadPermissions = botMember
                                ? forumThread.permissionsFor(botMember)
                                : null;
                            
                            if (!threadPermissions || threadPermissions.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
                                // Get the role for this game to mention in thread
                                const threadRoleMapping = {
                                    'genshin': config.genshinRole,
                                    'hkrpg': config.hsrRole,
                                    'nap': config.zzzRole
                                };
                                
                                const threadRoleId = threadRoleMapping[game];
                                let threadContent = '';
                                let threadAllowedMentions = { roles: [] };
                                
                                // Add role mention if role is configured and bot has permission
                                if (
                                    threadRoleId
                                    && (!threadPermissions || threadPermissions.has(PermissionFlagsBits.MentionEveryone))
                                ) {
                                    threadContent = `<@&${threadRoleId}>`;
                                    threadAllowedMentions = { roles: [threadRoleId] };
                                }
                                
                                // Send to the dedicated thread with role mention
                                await forumThread.send({ 
                                    content: threadContent,
                                    embeds: [embed],
                                    allowedMentions: threadAllowedMentions
                                });
                                sent = true;
                            }
                        }
                    }
                }
            } catch (forumError) {
                // Silently fail forum thread posting, don't affect main channel
                console.log(`Could not post to forum thread for guild ${guildId}:`, forumError.message);
            }
        }

        return sent;

    } catch (error) {
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
    getCodesToNotify
};
