const axios = require('axios');
const Code = require('../models/Code');
const Config = require('../models/Config');
const Settings = require('../models/Settings');
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
    'hkrpg': 'hsrRole',    // Fix: Changed from hkrpg to hsrRole to match Config schema
    'nap': 'zzzRole'       // Fix: Changed from nap to zzzRole to match Config schema
};

async function checkAndSendNewCodes(client) {
    console.log('Starting code check process...');
    const games = ['genshin', 'hkrpg', 'nap'];
    
    for (const game of games) {
        console.log(`Checking codes for ${gameNames[game]}`); 
        
        try {
            console.log(`Fetching from API for ${game}...`); 
            const response = await axios.get(`https://hoyo-codes.seria.moe/codes?game=${game}`);
            console.log('API Response:', JSON.stringify(response.data, null, 2));
            
            const groupedCodes = {};

            // Group codes by game
            if (response.data?.codes?.length) {
                for (const codeData of response.data.codes) {
                    console.log(`Processing code: ${codeData.code}`); 
                    
                    try {
                        const existingCode = await Code.findOne({ code: codeData.code, game: codeData.game });
                        
                        if (!existingCode && codeData.status === 'OK') {
                            // Save new code
                            const newCode = new Code({
                                game: codeData.game,
                                code: codeData.code,
                                reward: codeData.rewards || 'Not specified',
                                isExpired: false,
                            });
                            await newCode.save();

                            // Group codes by game
                            if (!groupedCodes[codeData.game]) {
                                groupedCodes[codeData.game] = [];
                            }
                            groupedCodes[codeData.game].push(codeData);
                        }
                    } catch (dbError) {
                        console.error(`Database operation failed for code ${codeData.code}:`, dbError);
                    }
                }

                // Send notifications for each game's codes
                const configs = await Config.find({});
                
                for (const game in groupedCodes) {
                    const codes = groupedCodes[game];
                    if (codes.length > 0) {
                        const embed = new EmbedBuilder()
                            .setColor('#00ff00')
                            .setTitle(`New ${gameNames[game]} Codes!`)
                            .setDescription(codes.map(code => 
                                `**${code.code}**\n[Click to redeem](${redeemUrls[game]}?code=${code.code})\n└ Rewards: ${code.rewards || 'Not specified'}`
                            ).join('\n\n'))
                            .setTimestamp();

                        for (const config of configs) {
                            // Check if auto-send is enabled for this guild
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
                            }
                        }
                    }
                }
            } else {
                console.error('Invalid API response structure:', response.data); 
            }
        } catch (error) {
            console.error(`Error processing ${game}:`, error.message); 
            if (error.response) {
                console.error('Error response:', error.response.data); 
            }
        }
    }
}

module.exports = { checkAndSendNewCodes };