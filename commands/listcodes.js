const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const Code = require('../models/Code');
const languageManager = require('../utils/language');

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
        try {
            const game = interaction.options.getString('game');
            
            // Get translated messages using correct key
            const loadingMessage = await languageManager.getString('commands.listcodes.loading', interaction.guildId);
            await interaction.reply({ content: loadingMessage, ephemeral: false });

            const response = await axios.get(`https://hoyo-codes.seria.moe/codes?game=${game}`);
            
            if (!response.data?.codes?.length) {
                const noCodesMessage = await languageManager.getString(
                    'commands.listcodes.noCodes', 
                    interaction.guildId,
                    { game: gameNames[game] }
                );
                return await interaction.editReply({ content: noCodesMessage });
            }

            // Get game choice
            const gameNames = {
                'genshin': 'Genshin Impact',
                'hkrpg': 'Honkai: Star Rail',
                'nap': 'Zenless Zone Zero'
            };

            const title = await languageManager.getString(
                'commands.listcodes.title',
                interaction.guildId,
                { game: gameNames[game] }
            );

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(title)
                .setTimestamp();

            const redeemUrls = {
                'genshin': 'https://genshin.hoyoverse.com/en/gift',
                'hkrpg': 'https://hsr.hoyoverse.com/gift',
                'nap': 'https://zenless.hoyoverse.com/redemption'
            };

            // In the execute function where rewards are displayed
            const description = await Promise.all(response.data.codes
                .sort((a, b) => b.id - a.id)
                .map(async code => {
                    const rewardText = code.rewards ? 
                        await languageManager.getRewardString(code.rewards, interaction.guildId) : 
                        await languageManager.getString('commands.listcodes.noReward', interaction.guildId);
                        
                    const redeemText = await languageManager.getString('commands.listcodes.redeemButton', interaction.guildId);
                    
                    return `**${code.code}**\n` +
                        `${rewardText}\n` +
                        `[${redeemText}](${redeemUrls[game]}?code=${code.code})`;
                }));

            embed.setDescription(description.join('\n\n'));

            const redeemHeader = await languageManager.getString('commands.listcodes.redeemHeader', interaction.guildId);
            embed.addFields({ name: redeemHeader, value: redeemUrls[game] });

            await interaction.editReply({ content: null, embeds: [embed] });

        } catch (error) {
            console.error('Error:', error);
            try {
                const errorMessage = await languageManager.getString('commands.listcodes.error', interaction.guildId);
                if (interaction.replied) {
                    await interaction.editReply({ content: errorMessage });
                } else {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                }
            } catch (e) {
                console.error('Failed to send error message:', e);
            }
        }
    }
};