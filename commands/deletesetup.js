// commands/deletesetup.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Config = require('../models/Config');
const Settings = require('../models/Settings');
const Language = require('../models/Language');
const languageManager = require('../utils/language');
const { hasAdminPermission } = require('../utils/permissions');
const { handleDMRestriction } = require('../utils/dmHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletesetup')
        .setDescription('Delete all bot configuration for this server'),
        // Default permissions restriction removed to make command visible to everyone
        // Admin permissions will be enforced in the execute function

    async execute(interaction) {
        try {
            // Check if command is used in DMs
            if (await handleDMRestriction(interaction, 'deletesetup')) {
                return;
            }

            // Check if user is admin or bot owner using our utility
            if (!hasAdminPermission(interaction)) {
                const noPermMessage = await languageManager.getString(
                    'commands.deletesetup.noPermission',
                    interaction.guildId
                );
                return interaction.reply({ content: noPermMessage, ephemeral: true });
            }

            // Get language strings for later use BEFORE we delete the language settings
            const loadingMessage = await languageManager.getString(
                'commands.deletesetup.loading',
                interaction.guildId
            );
            
            const successMessage = await languageManager.getString(
                'commands.deletesetup.success',
                interaction.guildId
            );
            
            const noConfigMessage = await languageManager.getString(
                'commands.deletesetup.noConfig',
                interaction.guildId
            );
            
            const deletedItemsHeader = await languageManager.getString(
                'commands.deletesetup.deletedItemsHeader',
                interaction.guildId
            );
            
            const configDeletedMsg = await languageManager.getString(
                'commands.deletesetup.deletedConfig',
                interaction.guildId
            );
            
            const settingsDeletedMsg = await languageManager.getString(
                'commands.deletesetup.deletedSettings',
                interaction.guildId
            );
            
            const langDeletedMsg = await languageManager.getString(
                'commands.deletesetup.deletedLanguage',
                interaction.guildId
            );
            
            // Show loading message
            await interaction.reply({ content: loadingMessage, ephemeral: true });

            // Delete all configurations for this guild
            const configResult = await Config.deleteOne({ guildId: interaction.guildId });
            const settingsResult = await Settings.deleteOne({ guildId: interaction.guildId });
            const langResult = await Language.deleteOne({ guildId: interaction.guildId });

            // Generate success message
            const deletedItems = [];
            if (configResult.deletedCount > 0) {
                deletedItems.push(`• ${configDeletedMsg}`);
            }
            
            if (settingsResult.deletedCount > 0) {
                deletedItems.push(`• ${settingsDeletedMsg}`);
            }
            
            if (langResult.deletedCount > 0) {
                deletedItems.push(`• ${langDeletedMsg}`);
            }

            let responseMessage;
            if (deletedItems.length > 0) {
                responseMessage = `**${successMessage}**\n\n**${deletedItemsHeader}**\n${deletedItems.join('\n')}`;
            } else {
                responseMessage = noConfigMessage;
            }

            await interaction.editReply({ content: responseMessage });

        } catch (error) {
            console.error('Error deleting server configuration:', error);
            
            // In case of error, try to get error message
            let errorMessage;
            try {
                errorMessage = await languageManager.getString(
                    'commands.deletesetup.error',
                    interaction.guildId
                );
            } catch (e) {
                // Fallback in case language system is unavailable
                errorMessage = 'An error occurred while deleting server configuration.';
            }
            
            if (interaction.replied) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
};