const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Api } = require('@top-gg/sdk');
const languageManager = require('../utils/language');

// Initialize Top.gg API with your token
const api = new Api(process.env.TOPGG_TOKEN);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vote')
        .setDescription('Get information about voting for the bot'),

    async execute(interaction) {
        try {
            // Check if user has voted
            const hasVoted = await api.hasVoted(interaction.user.id);
            
            const embed = new EmbedBuilder()
                .setColor(hasVoted ? '#00FF00' : '#FF69B4')
                .setTitle(await languageManager.getString('commands.vote.title', interaction.guildId))
                .setDescription(await languageManager.getString('commands.vote.description', interaction.guildId))
                .addFields(
                    {
                        name: await languageManager.getString('commands.vote.status', interaction.guildId),
                        value: hasVoted ? 
                            await languageManager.getString('commands.vote.hasVoted', interaction.guildId) : 
                            await languageManager.getString('commands.vote.hasNotVoted', interaction.guildId)
                    },
                    {
                        name: await languageManager.getString('commands.vote.link', interaction.guildId),
                        value: '[Top.gg](https://top.gg/bot/1124167011585511516/vote)'
                    }
                )
                .setTimestamp();

            await interaction.reply({ 
                embeds: [embed],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in vote command:', error);
            await interaction.reply({ 
                content: await languageManager.getString('commands.vote.error', interaction.guildId),
                ephemeral: true 
            });
        }
    }
};