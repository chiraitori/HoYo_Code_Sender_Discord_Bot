// utils/topggWebhook.js
const { Webhook } = require('@top-gg/sdk');
const { EmbedBuilder } = require('discord.js');
const languageManager = require('./language');
const Config = require('../models/Config');

// Store information about where users initiated votes
const voteChannelTracker = new Map();

// Cooldown tracker to prevent processing duplicate webhooks
const recentVotes = new Map();
const VOTE_COOLDOWN = 60000; // 60 seconds cooldown to prevent duplicates

// Function to track which channel a user used the vote command in
function trackVoteCommand(userId, channelId, guildId) {
    voteChannelTracker.set(userId, { channelId, guildId, timestamp: Date.now() });
    
    // Clear the entry after 24 hours to prevent memory leaks
    setTimeout(() => {
        voteChannelTracker.delete(userId);
    }, 24 * 60 * 60 * 1000);
}

function setupTopggWebhook(app, client) {
    // Create webhook instance with your Top.gg webhook authorization (not bot token)
    const webhook = new Webhook(process.env.WEBHOOK_PASSWORD);  // Replace "topggauth123" with your actual Top.gg webhook authorization
    
    // Apply the webhook listener middleware
    app.post('/topgg/webhook', webhook.listener(async (voteData) => {
        try {
            if (!voteData || !voteData.user) {
                return;
            }
            
            const userId = voteData.user;
            
            // Check if this is a duplicate vote (within cooldown period)
            const lastVoteTime = recentVotes.get(userId);
            const now = Date.now();
            if (lastVoteTime && (now - lastVoteTime < VOTE_COOLDOWN)) {
                return;
            }
            
            // Record this vote to prevent duplicates
            recentVotes.set(userId, now);
            
            // Clean up old vote records after cooldown period
            setTimeout(() => {
                if (recentVotes.get(userId) === now) {
                    recentVotes.delete(userId);
                }
            }, VOTE_COOLDOWN);
            
            try {
                const user = await client.users.fetch(userId);
                
                // Check if we have tracking information for where this user initiated the vote command
                const trackingInfo = voteChannelTracker.get(userId);
                
                // Flag to prevent duplicate messages
                let thankyouSent = false;
                
                // First try to send to the original channel where the vote command was initiated
                if (trackingInfo) {
                    try {
                        // Attempt to get the channel where the vote was initiated
                        const channel = await client.channels.fetch(trackingInfo.channelId);
                        if (channel) {
                            // Get translated strings for this server
                            const thankTitle = await languageManager.getString(
                                'commands.vote.thankTitle', 
                                trackingInfo.guildId
                            ) || 'Thank You for Voting! 🎉';
                            
                            const thankMessage = await languageManager.getString(
                                'commands.vote.thankMessage', 
                                trackingInfo.guildId
                            ) || 'Thank you {user} for supporting the bot by voting on Top.gg! Your support helps us grow.';
                            
                            const voteAgainMsg = await languageManager.getString(
                                'commands.vote.voteAgain', 
                                trackingInfo.guildId
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

                            // Send message with no mention
                            try {
                                await channel.send({
                                    embeds: [embed],
                                });
                                
                                // Mark that we've sent a thank you message
                                thankyouSent = true;
                                
                                // Remove from tracker since we've handled this vote
                                voteChannelTracker.delete(userId);
                            } catch (sendError) {
                                // Silently handle error and fall back to default channel for this guild
                            }
                        }
                    } catch (channelError) {
                        // If there's an error, we'll fall back to the default behavior below
                    }
                }
                
                // If we couldn't send to the original channel, find a suitable fallback channel
                // in the SAME guild where the vote command was used
                if (!thankyouSent && trackingInfo && trackingInfo.guildId) {
                    try {
                        // Find the configuration for the specific guild where the vote command was used
                        const guildConfig = await Config.findOne({ guildId: trackingInfo.guildId });
                        
                        if (guildConfig && guildConfig.channel) {
                            const channel = await client.channels.fetch(guildConfig.channel);
                            if (channel) {
                                // Get translated strings for this server
                                const thankTitle = await languageManager.getString(
                                    'commands.vote.thankTitle', 
                                    trackingInfo.guildId
                                ) || 'Thank You for Voting! 🎉';
                                
                                const thankMessage = await languageManager.getString(
                                    'commands.vote.thankMessage', 
                                    trackingInfo.guildId
                                ) || 'Thank you {user} for supporting the bot by voting on Top.gg! Your support helps us grow.';
                                
                                const voteAgainMsg = await languageManager.getString(
                                    'commands.vote.voteAgain', 
                                    trackingInfo.guildId
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

                                // Send message with no mention
                                await channel.send({
                                    embeds: [embed]
                                });
                                
                                thankyouSent = true;
                            }
                        }
                    } catch (configError) {
                        // Silent error handling - no suitable channel in the original guild
                    }
                }
                
                // We don't fall back to other servers' channels anymore
                // This ensures thank you messages only appear in the server where the user voted
                
            } catch (userError) {
                // Silent error handling for user fetch failures
            }
            
        } catch (error) {
            // Silent error handling for webhook processing
        }
    }));
}

module.exports = { setupTopggWebhook, trackVoteCommand };