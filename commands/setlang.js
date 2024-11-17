const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Language = require('../models/Language');
const languageManager = require('../utils/language');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlang')
        .setDescription('Set the bot language for this server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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