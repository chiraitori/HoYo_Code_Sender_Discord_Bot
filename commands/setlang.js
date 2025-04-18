const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Language = require('../models/Language');
const languageManager = require('../utils/language');
const { hasAdminPermission } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlang')
        .setDescription('Set the bot language for this server')
        // Remove default permissions restriction to make command visible to everyone
        // Admin permissions will be enforced in the execute function
        .addStringOption(option =>
            option.setName('language')
                .setDescription('Select language')
                .setRequired(true)
                .addChoices(
                    { name: 'English', value: 'en' },
                    { name: 'Japanese', value: 'jp' },
                    { name: 'Vietnamese', value: 'vi' }
                )),

    async execute(interaction) {
        try {
            // Check if user is admin or bot owner using our utility
            if (!hasAdminPermission(interaction)) {
                const noPermMessage = await languageManager.getString(
                    'commands.setlang.noPermission',
                    interaction.guildId
                );
                return interaction.reply({ content: noPermMessage, ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });
            
            const newLang = interaction.options.getString('language');
            
            await Language.findOneAndUpdate(
                { guildId: interaction.guildId },
                { language: newLang },
                { upsert: true }
            );

            const successMessage = await languageManager.getString(
                'commands.setlang.success',
                interaction.guildId,
                { language: newLang.toUpperCase() }
            );

            await interaction.editReply({ content: successMessage });
            
        } catch (error) {
            console.error('Error setting language:', error);
            const errorMessage = await languageManager.getString(
                'commands.setlang.error',
                interaction.guildId
            );
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
};