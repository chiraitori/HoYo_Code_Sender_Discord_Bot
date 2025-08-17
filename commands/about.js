const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const languageManager = require('../utils/language');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('Show information about the bot'),

    async execute(interaction) {
        try {
            const client_id = process.env.CLIENT_ID;
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(await languageManager.getString('commands.about.title', interaction.guildId))
                .setDescription(await languageManager.getString('commands.about.description', interaction.guildId))
                .addFields(
                    {
                        name: await languageManager.getString('commands.about.version', interaction.guildId),
                        value: process.env.VERSION || 'Unknown'
                    },
                    {
                        name: await languageManager.getString('commands.about.sourceCode', interaction.guildId),
                        value: '[GitHub](https://github.com/chiraitori/HoYo_Code_Sender_Discord_Bot)'
                    },
                    {
                        name: await languageManager.getString('commands.about.supportServer', interaction.guildId),
                        value: '[Support Server](https://discord.gg/DtuKCEkXzY)'
                    },
                    {
                        name: await languageManager.getString('commands.about.inviteLink', interaction.guildId),
                        value: `[Invite](https://discord.com/oauth2/authorize?client_id=${client_id}&permissions=2416331856&scope=applications.commands%20bot)`
                    },
                    {
                        name: await languageManager.getString('commands.about.donate', interaction.guildId),
                        value: '[Buy me a coffee](https://ko-fi.com/chiraitori)'
                    },
                    {
                        name: await languageManager.getString('commands.about.sponsor', interaction.guildId) || 'GitHub Sponsors',
                        value: '[GitHub Sponsors](https://github.com/sponsors/chiraitori)'
                    },
                    {
                        name: await languageManager.getString('commands.about.devbio', interaction.guildId),
                        value: '[Bio Link](https://chiraitori.me)'
                    }
                    
                )
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }
        catch (error) {
            console.error('Error in about command:', error);
            await interaction.reply({
                content: await languageManager.getString('commands.about.error', interaction.guildId),
                ephemeral: true
            });
        }
    }
};