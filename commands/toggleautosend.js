// commands/toggleautosend.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Settings = require('../models/Settings');
const languageManager = require('../utils/language');
const { hasAdminPermission } = require('../utils/permissions');
const { handleDMRestriction } = require('../utils/dmHandler');
const { removeOtherGuildRecords } = require('../utils/guildRecords');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toggleautosend')
        .setDescription('Enable or disable automatic code sending')
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
            if (await handleDMRestriction(interaction, 'toggleautosend')) {
                return;
            }

            if (!hasAdminPermission(interaction)) {
                const noPermMessage = await languageManager.getString(
                    'commands.toggleautosend.noPermission',
                    interaction.guildId
                );
                return interaction.reply({ content: noPermMessage, flags: MessageFlags.Ephemeral });
            }

            const loadingMessage = await languageManager.getString(
                'commands.toggleautosend.loading',
                interaction.guildId
            );

            await interaction.reply({
                content: loadingMessage,
                flags: MessageFlags.Ephemeral
            });

            const status = interaction.options.getString('status');
            const savedSettings = await Settings.findOneAndUpdate(
                { guildId: interaction.guildId },
                { autoSendEnabled: status === 'enable' },
                { upsert: true, new: true, sort: { _id: -1 } }
            );
            await removeOtherGuildRecords(Settings, interaction.guildId, savedSettings?._id);

            const successMessage = await languageManager.getString(
                'commands.toggleautosend.success',
                interaction.guildId,
                { status: status.toUpperCase() }
            );

            let extraInfo = '';
            if (status === 'enable') {
                extraInfo = '\n\n💡 **Tip:** Use `/autosendoptions` to control where codes are sent (channel, threads, or both).';
            }

            await interaction.editReply({
                content: successMessage + extraInfo
            });

        } catch (error) {
            console.error('Error setting auto-send:', error);

            const errorMessage = await languageManager.getString(
                'commands.toggleautosend.error',
                interaction.guildId
            );

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
            }
        }
    }
};
