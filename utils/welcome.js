// utils/welcome.js
const { EmbedBuilder } = require('discord.js');
const languageManager = require('./language');

/**
 * Send a welcome message when the bot joins a new guild
 * @param {Guild} guild - Discord guild object
 * @param {Client} client - Discord client
 */
async function sendWelcomeMessage(guild, client) {
    try {
        // Default language is English
        const guildId = guild.id;
        
        // Get translation strings (do this first to use in both channel and DM cases)
        const title = await languageManager.getString('welcome.title', guildId) || 
            'Thanks for Adding HoYo Code Sender!';
            
        const description = await languageManager.getString('welcome.description', guildId) ||
            'Thanks for adding me to your server! I\'ll help you get HoYoverse game codes automatically.';
            
        const setupHeader = await languageManager.getString('welcome.setupHeader', guildId) ||
            '🔧 Quick Setup Guide';
            
        const setupSteps = await languageManager.getString('welcome.setupSteps', guildId) ||
            '1. Run `/setup` to configure notification channel & roles\n' +
            '2. (Optional) Use `/favgames` to select which games to receive notifications for\n' +
            '3. (Optional) Change the language with `/setlang`\n\n' +
            'That\'s it! I\'ll now automatically send new game codes to your configured channel.';
            
        const helpTip = await languageManager.getString('welcome.helpTip', guildId) ||
            'For more information and tips, run `/help` anytime.';

        const dmInfo = await languageManager.getString('welcome.dmInfo', guildId) ||
            'I couldn\'t find a suitable channel to send the welcome message in your server, so I\'m sending it to you directly.';

        // Create welcome embed
        const welcomeEmbed = new EmbedBuilder()
            .setColor('#00AAFF')
            .setTitle(title)
            .setDescription(description)
            .addFields(
                { name: setupHeader, value: setupSteps },
                { name: '💡 Tip', value: helpTip }
            )
            .setFooter({
                text: await languageManager.getString('welcome.footer', guildId) || 
                    'HoYo Code Sender - Get your game codes automatically!'
            })
            .setTimestamp();
        
        // Try to find a suitable channel to send the welcome message
        // Priority: system channel > general/welcome/bot channels > first writable text channel
        let targetChannel = guild.systemChannel;
        
        if (!targetChannel || !canSendToChannel(targetChannel, client.user)) {
            const channelNames = ['bot-commands', 'bot', 'setup'];
            
            for (const name of channelNames) {
                const channel = guild.channels.cache.find(ch => 
                    ch.name.includes(name) && 
                    ch.type === 0 && // Text channels
                    canSendToChannel(ch, client.user)
                );
                
                if (channel) {
                    targetChannel = channel;
                    break;
                }
            }
            
            // If still no channel, find first available text channel
            if (!targetChannel) {
                targetChannel = guild.channels.cache.find(ch => 
                    ch.type === 0 && 
                    canSendToChannel(ch, client.user)
                );
            }
        }
        
        // If suitable channel found, send message there
        if (targetChannel) {
            await targetChannel.send({
                content: `<@${guild.ownerId}>`,
                embeds: [welcomeEmbed]
            });
            
            console.log(`Sent welcome message to ${guild.name} in #${targetChannel.name}`);
        } else {
            // If no suitable channel was found, try to DM the owner
            console.log(`Could not find a suitable channel to send welcome message in ${guild.name}, attempting to DM owner`);
            
            try {
                // Fetch the owner 
                const owner = await client.users.fetch(guild.ownerId);
                if (owner) {
                    // Add an extra field to explain why we're DMing
                    welcomeEmbed.addFields({ name: 'ℹ️ Note', value: dmInfo });
                    
                    await owner.send({ embeds: [welcomeEmbed] });
                    console.log(`Sent welcome DM to the owner of ${guild.name}`);
                }
            } catch (dmError) {
                console.error(`Could not send DM to the owner of ${guild.name}:`, dmError);
            }
        }
    } catch (error) {
        console.error(`Error sending welcome message to ${guild.name}:`, error);
    }
}

/**
 * Check if the bot can send messages to a channel
 * @param {Channel} channel - Discord channel
 * @param {User} botUser - Bot's user object
 * @returns {Boolean} - Whether bot can send messages
 */
function canSendToChannel(channel, botUser) {
    const permissions = channel.permissionsFor(botUser);
    return permissions && permissions.has(['ViewChannel', 'SendMessages']);
}

module.exports = { sendWelcomeMessage };