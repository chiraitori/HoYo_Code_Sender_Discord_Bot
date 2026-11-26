const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Language = require('../models/Language');
const languageManager = require('../utils/language');
const { hasAdminPermission } = require('../utils/permissions');
const { handleDMRestriction } = require('../utils/dmHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlang')
        .setDescription('Set the bot language for this server')
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
            if (await handleDMRestriction(interaction, 'setlang')) {
                return;
            }

            if (!hasAdminPermission(interaction)) {
                const noPermMessage = await languageManager.getString(
                    'commands.setlang.noPermission',
                    interaction.guildId
                );
                return interaction.reply({ content: noPermMessage, flags: MessageFlags.Ephemeral });
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const newLang = interaction.options.getString('language');
            await Language.findOneAndUpdate(
                { guildId: interaction.guildId },
                { language: newLang },
                { upsert: true }
            );

            languageManager.clearGuildCache(interaction.guildId);

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

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
            }
        }
    }
};
