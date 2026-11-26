const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { validateChannel } = require('../utils/channelValidator');
const Config = require('../models/Config');
const languageManager = require('../utils/language');
const { hasAdminPermission } = require('../utils/permissions');
const { handleDMRestriction } = require('../utils/dmHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkchannels')
        .setDescription('Check and validate notification channels'),

    async execute(interaction) {
        try {
            if (await handleDMRestriction(interaction, 'checkchannels')) {
                return;
            }

            if (!hasAdminPermission(interaction)) {
                const noPermMessage = await languageManager.getString(
                    'commands.checkchannels.noPermission',
                    interaction.guildId
                );
                return interaction.reply({ content: noPermMessage, flags: MessageFlags.Ephemeral });
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const guildId = interaction.guildId;
            const { isValid, error } = await validateChannel(interaction.client, guildId);

            if (!isValid) {
                const config = await Config.findOne({ guildId }).sort({ _id: -1 });
                let message = `⚠️ Channel validation failed: ${error}\n\n`;

                if (config && config.channel) {
                    message += `The configured channel ID is: ${config.channel}\n`;
                    message += 'Please make sure this channel exists and the bot has permissions to view it, send messages, and embed links.\n\n';
                } else {
                    message += 'No channel is configured for notifications. Please use /setup to configure a channel.\n\n';
                }

                message += 'You can use the /setup command to reconfigure the notification channel.';
                await interaction.editReply({ content: message });
            } else {
                await interaction.editReply({
                    content: '✅ The notification channel is valid and accessible! The bot can send messages to this channel without issues.'
                });
            }

        } catch (error) {
            console.error('Error in checkchannels command:', error);
            const content = 'An error occurred while checking channels. Please try again later.';
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content });
            } else {
                await interaction.reply({ content, flags: MessageFlags.Ephemeral });
            }
        }
    }
};
