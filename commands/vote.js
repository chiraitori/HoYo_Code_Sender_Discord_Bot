const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Api, Webhook } = require('@top-gg/sdk');
const languageManager = require('../utils/language');
const Config = require('../models/Config');

const api = new Api(process.env.TOPGG_TOKEN);
const webhook = new Webhook(process.env.TOPGG_AUTH);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vote')
        .setDescription('Get information about voting for the bot'),

    async execute(interaction) {
        try {
            const hasVoted = await api.hasVoted(interaction.user.id);
            
            const embed = new EmbedBuilder()
                .setColor(hasVoted ? '#00FF00' : '#FF69B4')
                .setTitle(await languageManager.getString('commands.vote.title', interaction.guildId))
                .setDescription(await languageManager.getString('commands.vote.description', interaction.guildId))
                .addFields(
                    {
                        name: await languageManager.getString('commands.vote.status', interaction.guildId),
                        value: hasVoted ? 
                            await languageManager.getString('commands.vote.hasVoted', interaction.guildId) : 
                            await languageManager.getString('commands.vote.hasNotVoted', interaction.guildId)
                    },
                    {
                        name: await languageManager.getString('commands.vote.link', interaction.guildId),
                        value: '[Top.gg](https://top.gg/bot/1124167011585511516/vote)'
                    }
                )
                .setTimestamp();

            await interaction.reply({ 
                embeds: [embed],
                ephemeral: true
            });
        } catch (error) {
            console.error('Error in vote command:', error);
            await interaction.reply({ 
                content: await languageManager.getString('commands.vote.error', interaction.guildId),
                ephemeral: true 
            });
        }
    },

    // Webhook handler for vote events
    async handleVote(client, vote) {
        try {
            const user = await client.users.fetch(vote.user);
            const configs = await Config.find({});
            
            for (const config of configs) {
                if (!config.channel) continue;
                
                const channel = client.channels.cache.get(config.channel);
                if (!channel) continue;

                const thankEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle(await languageManager.getString('commands.vote.thankTitle', config.guildId))
                    .setDescription(
                        (await languageManager.getString('commands.vote.thankMessage', config.guildId))
                        .replace('{user}', user.toString())
                    )
                    .setTimestamp();

                await channel.send({
                    content: `<@${user.id}>`,
                    embeds: [thankEmbed],
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error handling vote webhook:', error);
        }
    }
};