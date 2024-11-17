// commands/toggleautosend.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Settings = require('../models/Settings');
const languageManager = require('../utils/language');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toggleautosend')
        .setDescription('Enable/disable automatic code sending')
        .setDefaultMemberPermissions(PermissionFlagsBits.ADMINISTRATOR)
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

            await interaction.editReply({
                content: successMessage
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