const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { Api } = require('@top-gg/sdk');
const languageManager = require('../utils/language');
const { trackVoteCommand } = require('../utils/topggWebhook');

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
            // Track that this user initiated a vote command in this channel
            void trackVoteCommand(
                interaction.user.id,
                interaction.channelId,
                interaction.guildId,
                interaction.client
            ).catch(error => {
                console.error('Failed to sync vote tracking across shards:', error);
            });

            // Defer reply to give us time to check with Top.gg
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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

            const [title, description, statusLabel, hasVotedText, hasNotVotedText, linkText] = await Promise.all([
                languageManager.getString('commands.vote.title', interaction.guildId),
                languageManager.getString('commands.vote.description', interaction.guildId),
                languageManager.getString('commands.vote.status', interaction.guildId),
                languageManager.getString('commands.vote.hasVoted', interaction.guildId),
                languageManager.getString('commands.vote.hasNotVoted', interaction.guildId),
                languageManager.getString('commands.vote.link', interaction.guildId)
            ]);

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

            if (hasVoted) {
                embed.setFooter({
                    text: await languageManager.getString('commands.vote.voteAgain', interaction.guildId) ||
                        'You can vote again in 12 hours.',
                    iconURL: interaction.user.displayAvatarURL({ forceStatic: false })
                });
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in vote command:', error);
            const errorMsg = await languageManager.getString('commands.vote.error', interaction.guildId) ||
                'Error checking vote status. Please try again.';

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: errorMsg });
            } else {
                await interaction.reply({ content: errorMsg, flags: MessageFlags.Ephemeral });
            }
        }
    }
};
