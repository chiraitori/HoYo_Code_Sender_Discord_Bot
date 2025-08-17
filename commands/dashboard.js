const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const languageManager = require('../utils/language');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('Get the link to the web dashboard'),

    async execute(interaction) {
        try {
            const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3001';
            
            const embed = new EmbedBuilder()
                .setColor('#6A5ACD')
                .setTitle(await languageManager.getString('commands.dashboard.title', interaction.guildId))
                .setDescription(await languageManager.getString('commands.dashboard.description', interaction.guildId))
                .addFields(
                    {
                        name: await languageManager.getString('commands.dashboard.webInterface', interaction.guildId),
                        value: `🌐 [${await languageManager.getString('commands.dashboard.openDashboard', interaction.guildId)}](${dashboardUrl})`,
                        inline: false
                    },
                    {
                        name: await languageManager.getString('commands.dashboard.features', interaction.guildId),
                        value: await languageManager.getString('commands.dashboard.featuresList', interaction.guildId),
                        inline: false
                    },
                    {
                        name: await languageManager.getString('commands.dashboard.requirements', interaction.guildId),
                        value: await languageManager.getString('commands.dashboard.requirementsList', interaction.guildId),
                        inline: false
                    }
                )
                .setFooter({ 
                    text: await languageManager.getString('commands.dashboard.footer', interaction.guildId),
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }
        catch (error) {
            console.error('Error in dashboard command:', error);
            await interaction.reply({
                content: await languageManager.getString('commands.dashboard.error', interaction.guildId),
                ephemeral: true
            });
        }
    }
};
