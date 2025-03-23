const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Config = require('../models/Config');
const Settings = require('../models/Settings');
const Language = require('../models/Language');
const languageManager = require('../utils/language');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletesetup')
        .setDescription('Delete all bot configuration for this server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Add strict permission check
            if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
                const noPermMessage = await languageManager.getString(
                    'commands.deletesetup.noPermission',
                    interaction.guildId
                );
                // Remove the fallback string to ensure it always uses language files
                return interaction.reply({ content: noPermMessage, ephemeral: true });
            }

            // Loading message - remove fallback
            const loadingMessage = await languageManager.getString(
                'commands.deletesetup.loading',
                interaction.guildId
            );
            
            await interaction.reply({ content: loadingMessage, ephemeral: true });

            // Delete all configurations for this guild
            const configResult = await Config.deleteOne({ guildId: interaction.guildId });
            const settingsResult = await Settings.deleteOne({ guildId: interaction.guildId });
            
            // Keep language configuration for now - we'll need it to display the final message
            // We'll delete it after we get the success message
            // const langResult = await Language.deleteOne({ guildId: interaction.guildId });

            // Generate success message
            const deletedItems = [];
            if (configResult.deletedCount > 0) {
                const configDeletedMsg = await languageManager.getString(
                    'commands.deletesetup.deletedConfig',
                    interaction.guildId
                );
                deletedItems.push(configDeletedMsg);
            }
            
            if (settingsResult.deletedCount > 0) {
                const settingsDeletedMsg = await languageManager.getString(
                    'commands.deletesetup.deletedSettings',
                    interaction.guildId
                );
                deletedItems.push(settingsDeletedMsg);
            }

            let responseMessage;
            if (deletedItems.length > 0) {
                const successMessage = await languageManager.getString(
                    'commands.deletesetup.success',
                    interaction.guildId
                );
                
                const deletedItemsList = await languageManager.getString(
                    'commands.deletesetup.deletedItems',
                    interaction.guildId
                );
                
                responseMessage = `${successMessage}\n\n${deletedItemsList}\n• ${deletedItems.join('\n• ')}`;
                
                // Now that we've constructed our message, we can delete the language setting
                const langResult = await Language.deleteOne({ guildId: interaction.guildId });
                if (langResult.deletedCount > 0) {
                    const langDeletedMsg = await languageManager.getString(
                        'commands.deletesetup.deletedLanguage',
                        interaction.guildId
                    );
                    
                    // Add language deletion to the message
                    responseMessage += `\n• ${langDeletedMsg}`;
                }
            } else {
                responseMessage = await languageManager.getString(
                    'commands.deletesetup.noConfig',
                    interaction.guildId
                );
                
                // If there was nothing to delete, we can still delete language settings if they exist
                const langResult = await Language.deleteOne({ guildId: interaction.guildId });
            }

            await interaction.editReply({ content: responseMessage });

        } catch (error) {
            console.error('Error deleting server configuration:', error);
            
            const errorMessage = await languageManager.getString(
                'commands.deletesetup.error',
                interaction.guildId
            );
            
            if (interaction.replied) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
};