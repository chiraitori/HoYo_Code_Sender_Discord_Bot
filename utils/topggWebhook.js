// utils/topggWebhook.js
const { Webhook } = require('@top-gg/sdk');
const { EmbedBuilder } = require('discord.js');
const languageManager = require('./language');

function setupTopggWebhook(app, client) {
    const webhook = new Webhook(process.env.TOPGG_TOKEN);

    app.post('/topgg/webhook', webhook.listener(async (vote) => {
        try {
            const user = await client.users.fetch(vote.user);
            const lastChannel = client.channels.cache.get(vote.lastChannelId);
            
            if (lastChannel) {
                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('Thank you for voting! 🎉')
                    .setDescription(`Thank you ${user.tag} for voting! You can vote again in 12 hours.`)
                    .setTimestamp();

                await lastChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error handling vote webhook:', error);
        }
    }));
}

module.exports = { setupTopggWebhook };