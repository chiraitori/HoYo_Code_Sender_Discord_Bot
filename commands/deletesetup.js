// commands/deletesetup.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
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
                return interaction.reply({ content: noPermMessage, flags: MessageFlags.Ephemeral });
            }

            // Get language strings for later use BEFORE we delete the language settings
            const [
                loadingMessage,
                successMessage,
                noConfigMessage,
                deletedItemsHeader,
                configDeletedMsg,
                settingsDeletedMsg,
                langDeletedMsg
            ] = await Promise.all([
                languageManager.getString('commands.deletesetup.loading', interaction.guildId),
                languageManager.getString('commands.deletesetup.success', interaction.guildId),
                languageManager.getString('commands.deletesetup.noConfig', interaction.guildId),
                languageManager.getString('commands.deletesetup.deletedItemsHeader', interaction.guildId),
                languageManager.getString('commands.deletesetup.deletedConfig', interaction.guildId),
                languageManager.getString('commands.deletesetup.deletedSettings', interaction.guildId),
                languageManager.getString('commands.deletesetup.deletedLanguage', interaction.guildId)
            ]);

            // Show loading message
            await interaction.reply({ content: loadingMessage, flags: MessageFlags.Ephemeral });

            // Delete all configurations for this guild
            const [configResult, settingsResult, langResult] = await Promise.all([
                Config.deleteMany({ guildId: interaction.guildId }),
                Settings.deleteMany({ guildId: interaction.guildId }),
                Language.deleteMany({ guildId: interaction.guildId })
            ]);
            languageManager.clearGuildCache(interaction.guildId);

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

            let errorMessage;
            try {
                errorMessage = await languageManager.getString(
                    'commands.deletesetup.error',
                    interaction.guildId
                );
            } catch (e) {
                errorMessage = 'An error occurred while deleting server configuration.';
            }

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
            }
        }
    }
};
