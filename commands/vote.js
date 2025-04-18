const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Api } = require('@top-gg/sdk');
const languageManager = require('../utils/language');
const Config = require('../models/Config');

// Initialize the Top.gg API client if token is available
let api;
if (process.env.TOPGG_TOKEN) {
    api = new Api(process.env.TOPGG_TOKEN);
} else {
    console.warn('Warning: TOPGG_TOKEN not set. Vote command will have limited functionality.');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vote')
        .setDescription('Get information about voting for the bot'),

    async execute(interaction) {
        try {
            // Defer reply to give us time to check with Top.gg
            await interaction.deferReply({ ephemeral: true });
            
            let hasVoted = false;
            let voteCheckError = false;
            
            if (api) {
                try {
                    hasVoted = await api.hasVoted(interaction.user.id);
                } catch (voteError) {
                    console.error('Error checking vote status:', voteError);
                    voteCheckError = true;
                }
            } else {
                voteCheckError = true;
            }
            
            // Get translated strings
            const title = await languageManager.getString('commands.vote.title', interaction.guildId);
            const description = await languageManager.getString('commands.vote.description', interaction.guildId);
            const statusLabel = await languageManager.getString('commands.vote.status', interaction.guildId);
            const hasVotedText = await languageManager.getString('commands.vote.hasVoted', interaction.guildId);
            const hasNotVotedText = await languageManager.getString('commands.vote.hasNotVoted', interaction.guildId);
            const linkText = await languageManager.getString('commands.vote.link', interaction.guildId);
            
            // Create embed with vote information
            const embed = new EmbedBuilder()
                .setColor(hasVoted ? '#00FF00' : '#FF69B4')
                .setTitle(title)
                .setDescription(description)
                .addFields(
                    {
                        name: statusLabel,
                        value: voteCheckError ? 
                            (await languageManager.getString('errors.api', interaction.guildId) || 'Could not check vote status.') :
                            (hasVoted ? hasVotedText : hasNotVotedText)
                    },
                    {
                        name: linkText,
                        value: '[Top.gg](https://top.gg/bot/1124167011585511516/vote)'
                    }
                )
                .setTimestamp();

            // If user has voted, add a thank you message
            if (hasVoted) {
                embed.setFooter({ 
                    text: await languageManager.getString('commands.vote.voteAgain', interaction.guildId) || 
                          'You can vote again in 12 hours.',
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
                });
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in vote command:', error);
            const errorMsg = await languageManager.getString('commands.vote.error', interaction.guildId) ||
                'Error checking vote status. Please try again.';
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMsg });
            } else {
                await interaction.reply({ content: errorMsg, ephemeral: true });
            }
        }
    }
};