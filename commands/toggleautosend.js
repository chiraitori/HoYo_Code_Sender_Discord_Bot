// commands/toggleautosend.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Settings = require('../models/Settings');
const languageManager = require('../utils/language');
const { hasAdminPermission } = require('../utils/permissions');
const { handleDMRestriction } = require('../utils/dmHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toggleautosend')
        .setDescription('Enable/disable automatic code sending')
        // Remove the default permissions restriction to make command visible to everyone
        // Admin permissions will be enforced in the execute function
        .addStringOption(option =>
            option.setName('status')
                .setDescription('Enable or disable auto-send')
                .setRequired(true)
                .addChoices(
                    { name: 'Enable', value: 'enable' },
                    { name: 'Disable', value: 'disable' }
                )),

    async execute(interaction) {
        try {
            // Check if command is used in DMs
            if (await handleDMRestriction(interaction, 'toggleautosend')) {
                return;
            }

            // Check if user is admin or bot owner using our utility
            if (!hasAdminPermission(interaction)) {
                const noPermMessage = await languageManager.getString(
                    'commands.toggleautosend.noPermission',
                    interaction.guildId
                );
                return interaction.reply({ content: noPermMessage, ephemeral: true });
            }

            // Get translated loading message
            const loadingMessage = await languageManager.getString(
                'commands.toggleautosend.loading',
                interaction.guildId
            );

            await interaction.reply({ 
                content: loadingMessage, 
                ephemeral: true 
            });

            const status = interaction.options.getString('status');
            let settings = await Settings.findOne({ guildId: interaction.guildId });
            
            if (!settings) {
                settings = new Settings({ guildId: interaction.guildId });
            }

            settings.autoSendEnabled = status === 'enable';
            await settings.save();

            // Get translated success message
            const successMessage = await languageManager.getString(
                'commands.toggleautosend.success',
                interaction.guildId,
                { status: status.toUpperCase() }
            );

            // Add helpful tip about autosendoptions
            let extraInfo = '';
            if (status === 'enable') {
                extraInfo = '\n\n💡 **Tip:** Use `/autosendoptions` to control where codes are sent (channel, threads, or both).';
            }

            await interaction.editReply({
                content: successMessage + extraInfo
            });

        } catch (error) {
            console.error('Error setting auto-send:', error);
            
            // Get translated error message
            const errorMessage = await languageManager.getString(
                'commands.toggleautosend.error',
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