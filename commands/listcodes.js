const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const Code = require('../models/Code');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listcodes')
        .setDescription('List all active codes for a game')
        .addStringOption(option =>
            option.setName('game')
                .setDescription('Select game')
                .setRequired(true)
                .addChoices(
                    { name: 'Genshin Impact', value: 'genshin' },
                    { name: 'Honkai: Star Rail', value: 'hkrpg' },
                    { name: 'Zenless Zone Zero', value: 'nap' }
                )),
    async execute(interaction) {
        await interaction.deferReply(); // Defer the reply since API call might take time
        
        const game = interaction.options.getString('game');
        const gameNames = {
            'genshin': 'Genshin Impact',
            'hkrpg': 'Honkai: Star Rail',
            'nap': 'Zenless Zone Zero'
        };
        
        try {
            const response = await axios.get(`https://hoyo-codes.seria.moe/codes?game=${game}`);
            
            // Check if response.data exists and has the codes array
            if (!response.data || !response.data.codes || !Array.isArray(response.data.codes)) {
                console.error('Invalid API response:', response.data);
                await interaction.editReply('Error: Invalid response from API. Please try again later.');
                return;
            }

            const codes = response.data.codes;
            
            if (codes.length === 0) {
                await interaction.editReply(`No active codes found for ${gameNames[game]}.`);
                return;
            }

            // Create an embed for better presentation
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`Active Codes for ${gameNames[game]}`)
                .setTimestamp();

            let description = '';
            
            // Sort codes by ID (since expireAt is not in the response)
            codes.sort((a, b) => b.id - a.id);

            // Add redemption URLs for each game
            const redeemUrls = {
                'genshin': 'https://genshin.hoyoverse.com/en/gift',
                'hkrpg': 'https://hsr.hoyoverse.com/gift',
                'nap': 'https://zenless.hoyoverse.com/redemption'
            };

            // Modify the codes.forEach section
            codes.forEach(code => {
                let codeInfo = `**${code.code}**`;
                if (code.rewards) {
                    codeInfo += `\n└ Reward: ${code.rewards}`;
                }
                if (code.status && code.status !== 'OK') {
                    codeInfo += `\n└ Status: ${code.status}`;
                }
                codeInfo += `\n[Click to redeem](${redeemUrls[game]}?code=${code.code})`;
                description += `${codeInfo}\n\n`;
            });

            // If description is too long, split it into multiple fields
            if (description.length > 4096) {
                const chunks = description.match(/.{1,1024}/g);
                chunks.forEach((chunk, index) => {
                    embed.addFields({
                        name: index === 0 ? 'Codes' : 'Continued',
                        value: chunk
                    });
                });
            } else {
                embed.setDescription(description);
            }
            
            
            embed.addFields({
                name: 'Redeem Here',
                value: redeemUrls[game]
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching codes:', error);
            
            let errorMessage = 'Error fetching codes. Please try again later.';
            if (error.response) {
                console.error('API Error Response:', error.response.data);
                if (error.response.status === 404) {
                    errorMessage = `No codes found for ${gameNames[game]}.`;
                }
            }
            
            await interaction.editReply(errorMessage);
        }
    },
};