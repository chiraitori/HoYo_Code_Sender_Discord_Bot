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

async function checkAndSendNewCodes(client) {
    console.log('Starting code check process...');
    const games = ['genshin', 'hkrpg', 'nap'];
    
    for (const game of games) {
        try {
            const response = await axios.get(`https://hoyo-codes.seria.moe/codes?game=${game}`);
            const groupedCodes = {};

            if (response.data?.codes?.length) {
                for (const codeData of response.data.codes) {
                    try {
                        const existingCode = await Code.findOne({ code: codeData.code, game: codeData.game });
                        
                        if (!existingCode && codeData.status === 'OK') {
                            const newCode = new Code({
                                game: codeData.game,
                                code: codeData.code,
                                reward: codeData.rewards || 'Not specified',
                                isExpired: false,
                            });
                            await newCode.save();

                            if (!groupedCodes[codeData.game]) {
                                groupedCodes[codeData.game] = [];
                            }
                            groupedCodes[codeData.game].push(codeData);
                        }
                    } catch (dbError) {
                        console.error(`Database operation failed for code ${codeData.code}:`, dbError);
                    }
                }

                const configs = await Config.find({});
                
                for (const config of configs) {
                    const guildLang = await Language.findOne({ guildId: config.guildId });
                    const guildId = config.guildId;

                    for (const game in groupedCodes) {
                        const codes = groupedCodes[game];
                        if (codes.length > 0) {
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

                                const rewardsText = await languageManager.getString(
                                    'commands.listcodes.reward',
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

                                const embed = new EmbedBuilder()
                                    .setColor('#00ff00')
                                    .setTitle(title)
                                    .setDescription(finalDescription)
                                    .setTimestamp();

                                const settings = await Settings.findOne({ guildId: config.guildId });
                                if (!settings?.autoSendEnabled) continue;

                                if (config?.channel) {
                                    const channel = client.channels.cache.get(config.channel);
                                    if (channel) {
                                        const roleField = roleMapping[game];
                                        const roleId = config[roleField];
                                        const roleTag = roleId ? `<@&${roleId}> ` : '';
                                        
                                        await channel.send({ content: roleTag, embeds: [embed] });
                                    }
                                    console.log(`Done sending new codes`);
                                }
                            } catch (error) {
                                console.error(`Error sending message to guild ${config.guildId}:`, error);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error processing ${game}:`, error);
        }
    }
}

module.exports = { checkAndSendNewCodes };