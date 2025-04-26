const { SlashCommandBuilder } = require('discord.js');
const { validateChannel } = require('../utils/channelValidator');
const Settings = require('../models/Settings');
const Config = require('../models/Config');
const languageManager = require('../utils/language');
const { hasAdminPermission } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkchannels')
        .setDescription('Check and validate notification channels'),

    async execute(interaction) {
        try {
            // Check if user is admin or bot owner
            if (!hasAdminPermission(interaction)) {
                const noPermMessage = await languageManager.getString(
                    'commands.checkchannels.noPermission',
                    interaction.guildId
                );
                return interaction.reply({ content: noPermMessage, ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            const guildId = interaction.guildId;
            const { isValid, error } = await validateChannel(interaction.client, guildId);

            if (!isValid) {
                // Channel validation failed - provide helpful message
                const config = await Config.findOne({ guildId });
                let message = `⚠️ Channel validation failed: ${error}\n\n`;
                
                if (config && config.channel) {
                    message += `The configured channel ID is: ${config.channel}\n`;
                    message += "Please make sure this channel exists and the bot has permissions to view it, send messages, and embed links.\n\n";
                } else {
                    message += "No channel is configured for notifications. Please use /setup to configure a channel.\n\n";
                }
                
                message += "You can use the /setup command to reconfigure the notification channel.";
                await interaction.editReply({ content: message });
            } else {
                // Channel is valid
                await interaction.editReply({ 
                    content: "✅ The notification channel is valid and accessible! The bot can send messages to this channel without issues."
                });
            }
            
        } catch (error) {
            console.error('Error in checkchannels command:', error);
            await interaction.editReply({ 
                content: "An error occurred while checking channels. Please try again later."
            });
        }
    }
};
