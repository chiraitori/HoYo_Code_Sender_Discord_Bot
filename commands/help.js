// commands/help.js
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const languageManager = require('../utils/language');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show setup instructions and available commands'),

    async execute(interaction) {
        try {
            const [
                title,
                description,
                setupHeader,
                setupSteps,
                commandsHeader,
                commandsList,
                tipsHeader,
                tipsList,
                footer
            ] = await Promise.all([
                languageManager.getString('commands.help.title', interaction.guildId),
                languageManager.getString('commands.help.description', interaction.guildId),
                languageManager.getString('commands.help.setupHeader', interaction.guildId),
                languageManager.getString('commands.help.setupSteps', interaction.guildId),
                languageManager.getString('commands.help.commandsHeader', interaction.guildId),
                languageManager.getString('commands.help.commandsList', interaction.guildId),
                languageManager.getString('commands.help.tipsHeader', interaction.guildId),
                languageManager.getString('commands.help.tipsList', interaction.guildId),
                languageManager.getString('commands.help.footer', interaction.guildId)
            ]);

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
                    text: footer || 'HoYo Code Sender - Get HoYoverse game codes automatically!'
                })
                .setTimestamp();

            const shouldBeEphemeral = Boolean(
                interaction.guild && interaction.user.id !== interaction.guild.ownerId
            );
            await interaction.reply({
                embeds: [helpEmbed],
                ...(shouldBeEphemeral ? { flags: MessageFlags.Ephemeral } : {})
            });

        } catch (error) {
            console.error('Error showing help:', error);

            const errorMessage = await languageManager.getString(
                'commands.help.error',
                interaction.guildId
            ) || 'An error occurred while showing help.';

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({
                    content: errorMessage,
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
};
