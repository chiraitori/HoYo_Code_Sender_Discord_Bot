const axios = require('axios');
const Code = require('../models/Code');
const Config = require('../models/Config');
const Settings = require('../models/Settings');
const Language = require('../models/Language');
const languageManager = require('./language');
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

// Support links for donations
const supportLinks = {
    kofi: 'https://ko-fi.com/chiraitori',
    paypal: 'https://paypal.me/chiraitori',
    banking: 'Use /about command for Vietnamese banking details'
};

async function checkAndSendNewCodes(client) {
    console.log('Starting code check process...');
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
        }, {});        // Batch fetch all existing codes
        const allExistingCodes = await Code.find({}).lean();
        const existingCodesSet = new Set(allExistingCodes.map(code => `${code.game}:${code.code}`));        // Fetch all games' codes in parallel
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
                const newCodes = gameCodes.filter(codeData => 
                    !existingCodesSet.has(`${codeData.game}:${codeData.code}`) && 
                    codeData.status === 'OK'
                );

                if (newCodes.length) {
                    newCodesForGames[game] = newCodes;
                      // Prepare codes for batch save
                    newCodes.forEach(codeData => {
                        codesToSave.push({
                            game: codeData.game,
                            code: codeData.code,
                            isExpired: false
                        });
                    });
                }
            }
        });        // Find codes that are no longer in API (expired)
        // Only check expiration for games where API request was successful
        const expiredCodes = allExistingCodes.filter(code => 
            !code.isExpired && // Only check codes that aren't already marked as expired
            !failedGames.has(code.game) && // Skip games with failed API requests
            !activeCodesFromAPI.has(`${code.game}:${code.code}`) // Code not found in API response
        );

        // Find codes that were marked as expired but are now active again in API
        // This handles cases where codes get reactivated or were falsely marked as expired
        const reactivatedCodes = allExistingCodes.filter(code => 
            code.isExpired && // Only check codes that are currently marked as expired
            !failedGames.has(code.game) && // Skip games with failed API requests
            activeCodesFromAPI.has(`${code.game}:${code.code}`) // Code found active in API response
        );

        // Batch operations
        const operations = [];
        
        // Add new codes
        if (codesToSave.length > 0) {
            operations.push(Code.insertMany(codesToSave));
        }        // Mark expired codes
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
        }        // Prepare message sending for guilds with new codes
        const messageTasks = [];
        const guildsToCleanup = [];

        // Filter configs that have autoSend enabled
        for (const config of configs) {
            const guildId = config.guildId;
            const settings = settingsMap[guildId];
            
            // Check if bot is still in the guild
            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                // Bot was kicked/removed from guild, mark for cleanup
                guildsToCleanup.push(guildId);
                continue;
            }
            
            // Skip if autoSend is disabled
            if (!settings?.autoSendEnabled) continue;

            // Process each game with new codes
            for (const game in newCodesForGames) {
                // Skip if favorite games filter is enabled and this game is not selected
                if (settings?.favoriteGames?.enabled && 
                    settings.favoriteGames.games && 
                    settings.favoriteGames.games[game] === false) {
                    continue;
                }

                const codes = newCodesForGames[game];
                if (codes.length > 0) {
                    messageTasks.push(sendCodeNotification(client, config, game, codes, guildId, languageMap[guildId]));
                }
            }
        }

        // Clean up configurations for guilds where bot was removed
        if (guildsToCleanup.length > 0) {
            const cleanupTasks = guildsToCleanup.map(guildId => cleanupGuildConfiguration(guildId));
            await Promise.allSettled(cleanupTasks);
        }

        // Execute all message sending tasks 
        if (messageTasks.length > 0) {
            await Promise.allSettled(messageTasks);
        }
        
        console.log(`Code check process completed. Found ${codesToSave.length} new codes, ${expiredCodes.length} expired codes, ${reactivatedCodes.length} reactivated codes.`);
    } catch (error) {
        console.error('Error in checkAndSendNewCodes:', error);
    }
}

async function sendCodeNotification(client, config, game, codes, guildId, guildLang) {
    // Validate inputs silently
    if (!config?.channel || !guildId || !codes?.length) {
        return;
    }

    try {
        // Get guild and channel with silent validation
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            // Guild not found, clean up configuration
            await cleanupGuildConfiguration(guildId);
            return;
        }        const channel = client.channels.cache.get(config.channel);
        if (!channel) {
            // Channel not found, notify owner once and return silently
            await notifyGuildOwnerMissingChannel(client, guild, config);
            return;
        }

        // Check if channel is text-based
        if (!channel.isTextBased()) {
            return;
        }

        // Check if channel.send is a function
        if (typeof channel.send !== 'function') {
            return;
        }

        // Check bot permissions
        const botMember = guild.members.cache.get(client.user.id);
        if (!botMember) {
            return;
        }        const channelPermissions = channel.permissionsFor(botMember);
        if (!channelPermissions || !channelPermissions.has(PermissionFlagsBits.SendMessages)) {
            // Missing send messages permission, notify owner once
            await notifyGuildOwnerMissingPermissions(client, guild, config, 'SendMessages');
            return;
        }

        if (!channelPermissions.has(PermissionFlagsBits.EmbedLinks)) {
            // Missing embed links permission, notify owner once
            await notifyGuildOwnerMissingPermissions(client, guild, config, 'EmbedLinks');
            return;
        }

        // Generate notification content
        const title = await languageManager.getString(
            'commands.listcodes.newCodes',
            guildId,
            { game: gameNames[game] }
        );

        const redeemText = await languageManager.getString(
            'commands.listcodes.redeemButton',
            guildId
        );

        const descriptionPromises = codes.map(async code => {
            const rewardString = code.rewards ? 
                await languageManager.getRewardString(code.rewards, guildId) : 
                await languageManager.getString('commands.listcodes.noReward', guildId);
            
            return `**${code.code}**\n[${redeemText}](${redeemUrls[game]}?code=${code.code})\n└ ${rewardString}`;
        });

        const descriptions = await Promise.all(descriptionPromises);
        const finalDescription = descriptions.join('\n\n');

        const supportMsg = await languageManager.getString(
            'common.supportMsg', 
            guildId
        ) || '❤️ Support: ko-fi.com/chiraitori | paypal.me/chiraitori';

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle(title)
            .setDescription(finalDescription)
            .setFooter({ text: supportMsg })
            .setTimestamp();

        // Prepare message content with proper role mentions
        const roleField = roleMapping[game];
        const roleId = config[roleField];
        let content = '';
        let allowedMentions = {};

        if (roleId) {
            content = `<@&${roleId}>`;
            // Check role mention permissions
            if (channelPermissions.has(PermissionFlagsBits.MentionEveryone)) {
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
        }

        // Send the message
        await channel.send({ 
            content: content, 
            embeds: [embed],
            allowedMentions: allowedMentions
        });

    } catch (error) {        // Handle specific Discord API errors silently
        if (error.code === 50001 || error.code === 50013) {
            // Missing Access (50001) or Missing Permissions (50013)
            const guild = client.guilds.cache.get(guildId);
            if (guild) {
                await notifyGuildOwnerMissingPermissions(client, guild, config, 'SendMessages');
            }
            return;
        }

        if (error.code === 10003) {
            // Unknown Channel - channel was deleted
            const guild = client.guilds.cache.get(guildId);
            if (guild) {
                await notifyGuildOwnerMissingChannel(client, guild, config);
            }
            return;
        }

        // For other errors, fail silently
        return;
    }
}

// Helper function to clean up guild configuration when bot is kicked
async function cleanupGuildConfiguration(guildId) {
    try {
        await Promise.all([
            Config.deleteOne({ guildId }),
            Settings.deleteOne({ guildId }),
            Language.deleteOne({ guildId })
        ]);
    } catch (error) {
        // Silently handle cleanup errors
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

module.exports = { checkAndSendNewCodes };