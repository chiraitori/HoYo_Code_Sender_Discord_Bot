const axios = require('axios');
const Code = require('../models/Code');
const Config = require('../models/Config');
const Settings = require('../models/Settings');
const Language = require('../models/Language');
const languageManager = require('./language');
const { EmbedBuilder } = require('discord.js');

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
        }, {});

        // Batch fetch all existing codes
        const allExistingCodes = await Code.find({}).lean();
        const existingCodesSet = new Set(allExistingCodes.map(code => `${code.game}:${code.code}`));

        // Fetch all games' codes in parallel
        const gameCodeRequests = games.map(game => 
            axios.get(`https://hoyo-codes.seria.moe/codes?game=${game}`)
                .catch(error => {
                    console.error(`Error fetching codes for ${game}:`, error);
                    return { data: { codes: [] } };
                })
        );

        const gameResponses = await Promise.all(gameCodeRequests);
        const newCodesForGames = {};
        const codesToSave = [];

        // Process all games' responses
        gameResponses.forEach((response, index) => {
            const game = games[index];
            const gameCodes = response.data?.codes || [];
            
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
                            reward: codeData.rewards || 'Not specified',
                            isExpired: false
                        });
                    });
                }
            }
        });

        // Batch save all new codes at once if any
        if (codesToSave.length > 0) {
            await Code.insertMany(codesToSave);
        }

        // Prepare message sending for guilds with new codes
        const messageTasks = [];

        // Filter configs that have autoSend enabled
        for (const config of configs) {
            const guildId = config.guildId;
            const settings = settingsMap[guildId];
            
            // Skip if autoSend is disabled
            if (!settings?.autoSendEnabled) continue;

            // Process each game with new codes
            for (const game in newCodesForGames) {
                // Skip if favorite games filter is enabled and this game is not selected
                if (settings?.favoriteGames?.enabled && 
                    settings.favoriteGames.games && 
                    settings.favoriteGames.games[game] === false) {
                    console.log(`Skipping ${game} codes for guild ${guildId} (filtered out)`);
                    continue;
                }

                const codes = newCodesForGames[game];
                if (codes.length > 0) {
                    messageTasks.push(sendCodeNotification(client, config, game, codes, guildId, languageMap[guildId]));
                }
            }
        }

        // Execute all message sending tasks 
        if (messageTasks.length > 0) {
            await Promise.all(messageTasks);
        }
        
        console.log(`Code check process completed. Found ${codesToSave.length} new codes.`);
    } catch (error) {
        console.error('Error in checkAndSendNewCodes:', error);
    }
}

async function sendCodeNotification(client, config, game, codes, guildId, guildLang) {
    try {
        const title = await languageManager.getString(
            'commands.listcodes.newCodes',
            guildId,
            { game: gameNames[game] }
        );

        const redeemText = await languageManager.getString(
            'commands.listcodes.redeemButton',
            guildId
        );

        // Generate all descriptions at once
        const descriptionPromises = codes.map(async code => {
            const rewardString = code.rewards ? 
                await languageManager.getRewardString(code.rewards, guildId) : 
                await languageManager.getString('commands.listcodes.noReward', guildId);
            
            return `**${code.code}**\n[${redeemText}](${redeemUrls[game]}?code=${code.code})\n└ ${rewardString}`;
        });

        const descriptions = await Promise.all(descriptionPromises);
        const finalDescription = descriptions.join('\n\n');

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle(title)
            .setDescription(finalDescription)
            .setTimestamp();

        if (config?.channel) {
            const channel = client.channels.cache.get(config.channel);
            if (channel) {
                const roleField = roleMapping[game];
                const roleId = config[roleField];
                const roleTag = roleId ? `<@&${roleId}> ` : '';
                
                await channel.send({ content: roleTag, embeds: [embed] });
                console.log(`Sent ${game} notification to guild ${guildId}`);
            }
        }
    } catch (error) {
        console.error(`Error sending message to guild ${guildId}:`, error);
    }
}

module.exports = { checkAndSendNewCodes };