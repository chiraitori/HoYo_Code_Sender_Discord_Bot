// commands/help.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const languageManager = require('../utils/language');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows how to setup the bot and provides usage tips'),

    async execute(interaction) {
        try {
            // Get translated strings
            const title = await languageManager.getString(
                'commands.help.title',
                interaction.guildId
            );

            const description = await languageManager.getString(
                'commands.help.description',
                interaction.guildId
            );

            const setupHeader = await languageManager.getString(
                'commands.help.setupHeader',
                interaction.guildId
            );

            const setupSteps = await languageManager.getString(
                'commands.help.setupSteps',
                interaction.guildId
            );

            const commandsHeader = await languageManager.getString(
                'commands.help.commandsHeader',
                interaction.guildId
            );

            const commandsList = await languageManager.getString(
                'commands.help.commandsList',
                interaction.guildId
            );

            const tipsHeader = await languageManager.getString(
                'commands.help.tipsHeader',
                interaction.guildId
            );

            const tipsList = await languageManager.getString(
                'commands.help.tipsList',
                interaction.guildId
            );

            // Create embed for better presentation
            const helpEmbed = new EmbedBuilder()
                .setColor('#00AAFF')
                .setTitle(title)
                .setDescription(description)
                .addFields(
                    { name: setupHeader, value: setupSteps },
                    { name: commandsHeader, value: commandsList },
                    { name: tipsHeader, value: tipsList }
                )
                .setFooter({
                    text: await languageManager.getString('commands.help.footer', interaction.guildId) ||
                        'HoYo Code Sender - Get HoYoverse game codes automatically!'
                })
                .setTimestamp();

            await interaction.reply({ 
                embeds: [helpEmbed],
                ephemeral: interaction.user.id !== interaction.guild.ownerId // Only show privately if not the server owner
            });

        } catch (error) {
            console.error('Error showing help:', error);
            
            const errorMessage = await languageManager.getString(
                'commands.help.error',
                interaction.guildId
            ) || 'An error occurred while showing help.';

            await interaction.reply({ 
                content: errorMessage,
                ephemeral: true
            });
        }
    }
};