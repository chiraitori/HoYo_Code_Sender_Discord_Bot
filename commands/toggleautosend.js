// commands/toggleautosend.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Settings = require('../models/Settings');

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
            const status = interaction.options.getString('status');
            let settings = await Settings.findOne({ guildId: interaction.guildId });
            
            if (!settings) {
                settings = new Settings({ guildId: interaction.guildId });
            }

            settings.autoSendEnabled = status === 'enable';
            await settings.save();

            await interaction.reply({
                content: `Auto-send is now: **${status.toUpperCase()}D**`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error setting auto-send:', error);
            await interaction.reply({
                content: 'Failed to update auto-send setting.',
                ephemeral: true
            });
        }
    }
};