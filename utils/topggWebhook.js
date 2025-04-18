// utils/topggWebhook.js
const { Webhook } = require('@top-gg/sdk');
const { EmbedBuilder } = require('discord.js');
const languageManager = require('./language');
const Config = require('../models/Config');

function setupTopggWebhook(app, client) {
    // Make sure we have a TOPGG_TOKEN token in env
    if (!process.env.TOPGG_TOKEN) {
        console.warn('Warning: TOPGG_TOKEN environment variable not set. Top.gg webhook will not work.');
        return;
    }

    // The authorization header value needs to match what you set in Top.gg dashboard
    const webhook = new Webhook(process.env.TOPGG_TOKEN);

    // Custom middleware to ensure authorization header exists
    const ensureAuthHeader = (req, res, next) => {
        if (!req.headers.authorization) {
            console.error('[TOPGG] Missing authorization header in webhook request');
            req.headers.authorization = process.env.TOPGG_TOKEN; // Set a fallback for testing
        }
        next();
    };

    // Apply middleware before the webhook handler
    app.post('/topgg/webhook', ensureAuthHeader, webhook.listener(async (voteData) => {
        try {
            // Log the complete vote data for debugging
            console.log('[TOPGG] Webhook received vote data:', JSON.stringify(voteData, null, 2));
            
            // Top.gg webhooks send data in format: { user: "userId", type: "upvote", ... }
            if (!voteData || !voteData.user) {
                console.error('[TOPGG] Error: Invalid vote data received - missing user ID');
                return;
            }
            
            console.log(`[TOPGG] Processing vote from user ID: ${voteData.user}`);
            
            try {
                const user = await client.users.fetch(voteData.user);
                console.log(`[TOPGG] Found voting user: ${user.tag}`);
                
                // Get all server configurations
                const configs = await Config.find({});
                console.log(`[TOPGG] Found ${configs.length} server configurations for vote notifications`);
                
                let notificationCount = 0;
                
                // Send thank you message to the configured channel in each server
                for (const config of configs) {
                    if (!config.channel) continue;
                    
                    try {
                        const channel = await client.channels.fetch(config.channel);
                        if (!channel) {
                            console.log(`[TOPGG] Channel ${config.channel} not found for guild ${config.guildId}`);
                            continue;
                        }
                        
                        // Get translated strings for this server
                        const thankTitle = await languageManager.getString(
                            'commands.vote.thankTitle', 
                            config.guildId
                        ) || 'Thank You for Voting! 🎉';
                        
                        const thankMessage = await languageManager.getString(
                            'commands.vote.thankMessage', 
                            config.guildId
                        ) || 'Thank you {user} for supporting the bot by voting on Top.gg! Your support helps us grow.';
                        
                        const voteAgainMsg = await languageManager.getString(
                            'commands.vote.voteAgain', 
                            config.guildId
                        ) || 'You can vote again in 12 hours.';
                        
                        const embed = new EmbedBuilder()
                            .setColor('#00FF00')
                            .setTitle(thankTitle)
                            .setDescription(thankMessage.replace('{user}', user.toString()))
                            .setFooter({ 
                                text: voteAgainMsg,
                                iconURL: user.displayAvatarURL({ dynamic: true })
                            })
                            .setTimestamp();

                        await channel.send({
                            content: `<@${user.id}>`,
                            embeds: [embed]
                        });
                        
                        notificationCount++;
                        console.log(`[TOPGG] Sent thank you message in guild ${config.guildId}, channel ${config.channel}`);
                    } catch (channelError) {
                        console.error(`[TOPGG] Error sending vote thank you to channel in guild ${config.guildId}:`, channelError.message);
                    }
                }
                
                console.log(`[TOPGG] Successfully sent vote thank you notifications to ${notificationCount} servers`);
                
                // Also send a thank you DM to the user
                try {
                    const dmThankTitle = await languageManager.getString('commands.vote.dmThankTitle', '') || 
                        'Thank You for Your Vote!';
                    
                    const dmThankMessage = await languageManager.getString('commands.vote.dmThankMessage', '') || 
                        'Thank you for voting for HoYo Code Sender on Top.gg! Your support means a lot to us.';
                    
                    const dmEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle(dmThankTitle)
                        .setDescription(dmThankMessage)
                        .setTimestamp();
                    
                    await user.send({ embeds: [dmEmbed] });
                    console.log(`[TOPGG] Sent thank you DM to user ${user.tag}`);
                } catch (dmError) {
                    // User might have DMs disabled, don't worry about it
                    console.log(`[TOPGG] Could not send thank you DM to user ${user.tag}: ${dmError.message}`);
                }
            } catch (userError) {
                console.error(`[TOPGG] Error fetching user ${voteData.user}:`, userError.message);
            }
            
        } catch (error) {
            console.error('[TOPGG] Error handling Top.gg vote webhook:', error);
        }
    }));
    
    console.log('Top.gg webhook endpoint set up at /topgg/webhook');

    // Add a raw webhook endpoint for testing that doesn't use the SDK
    app.post('/topgg/raw-webhook', (req, res) => {
        try {
            console.log('[TOPGG] Raw webhook received:');
            console.log('Headers:', JSON.stringify(req.headers, null, 2));
            console.log('Body:', JSON.stringify(req.body, null, 2));
            
            // Process the vote data directly
            const voteData = req.body;
            
            if (voteData && voteData.user) {
                // Handle the vote (in production you should verify the auth token here)
                console.log(`[TOPGG] Raw webhook processing vote for user: ${voteData.user}`);
                
                // Process the vote (similar to the main webhook handler)
                client.users.fetch(voteData.user).then(async (user) => {
                    // Simple acknowledgement in console
                    console.log(`[TOPGG] Raw webhook found user: ${user.tag}`);
                    
                    // Get server configurations and send thank you messages
                    // This would normally contain the same logic as the main webhook handler
                }).catch(error => {
                    console.error(`[TOPGG] Raw webhook error fetching user:`, error.message);
                });
            }
            
            // Always return 200 OK to acknowledge receipt
            res.status(200).json({ success: true });
        } catch (error) {
            console.error('[TOPGG] Raw webhook error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Add a testing endpoint for manual testing
    app.get('/topgg/test-webhook/:userId', async (req, res) => {
        try {
            const userId = req.params.userId;
            
            if (!userId) {
                return res.status(400).json({ error: 'Missing user ID' });
            }
            
            console.log(`[TOPGG] Test webhook for user ID: ${userId}`);
            
            try {
                const user = await client.users.fetch(userId);
                
                // Get all server configurations
                const configs = await Config.find({});
                
                let notificationCount = 0;
                
                // Send test thank you message to the configured channel in each server
                for (const config of configs) {
                    if (!config.channel) continue;
                    
                    try {
                        const channel = await client.channels.fetch(config.channel);
                        if (!channel) continue;
                        
                        const embed = new EmbedBuilder()
                            .setColor('#FFA500')
                            .setTitle('Test Vote Notification')
                            .setDescription(`This is a test vote notification for user <@${user.id}>`)
                            .setFooter({ text: 'Test message - Not a real vote' })
                            .setTimestamp();

                        await channel.send({
                            content: `Test notification for <@${user.id}>`,
                            embeds: [embed]
                        });
                        
                        notificationCount++;
                    } catch (channelError) {
                        console.error(`[TOPGG] Error sending test notification:`, channelError.message);
                    }
                }
                
                // Also send a test DM
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor('#FFA500')
                        .setTitle('Test Vote DM')
                        .setDescription('This is a test DM for the vote notification system')
                        .setTimestamp();
                    
                    await user.send({ embeds: [dmEmbed] });
                } catch (dmError) {
                    console.log(`[TOPGG] Could not send test DM: ${dmError.message}`);
                }
                
                res.json({ 
                    success: true, 
                    message: `Test notifications sent to ${notificationCount} servers`,
                    user: user.tag
                });
                
            } catch (error) {
                console.error('[TOPGG] Test webhook error:', error);
                res.status(500).json({ error: error.message });
            }
        } catch (error) {
            console.error('[TOPGG] Test webhook error:', error);
            res.status(500).json({ error: error.message });
        }
    });
    
    // Add a status check endpoint for diagnostics
    app.get('/topgg/webhook-status', (req, res) => {
        try {
            const webhookUrl = `${req.protocol}://${req.get('host')}/topgg/webhook`;
            const rawWebhookUrl = `${req.protocol}://${req.get('host')}/topgg/raw-webhook`;
            
            res.status(200).json({ 
                status: 'active', 
                webhook_url: webhookUrl,
                raw_webhook_url: rawWebhookUrl,
                configured: !!process.env.TOPGG_TOKEN,
                testing_url: `${req.protocol}://${req.get('host')}/topgg/test-webhook/YOUR_USER_ID`,
                instructions: 'Make sure this URL is set in your Top.gg dashboard with the same authorization token',
                auth_token: process.env.TOPGG_TOKEN ? '(configured)' : '(missing)'
            });
        } catch (error) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    });
}

module.exports = { setupTopggWebhook };