// utils/welcome.js
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const languageManager = require('./language');

/**
 * Send a welcome message when the bot joins a new guild
 * @param {Guild} guild - Discord guild object
 * @param {Client} client - Discord client
 */
async function sendWelcomeMessage(guild, client) {
    try {
        const guildId = guild.id;

        const [
            title,
            description,
            setupHeader,
            setupSteps,
            helpTip,
            dmInfo,
            footer
        ] = await Promise.all([
            languageManager.getString('welcome.title', guildId),
            languageManager.getString('welcome.description', guildId),
            languageManager.getString('welcome.setupHeader', guildId),
            languageManager.getString('welcome.setupSteps', guildId),
            languageManager.getString('welcome.helpTip', guildId),
            languageManager.getString('welcome.dmInfo', guildId),
            languageManager.getString('welcome.footer', guildId)
        ]);

        const welcomeEmbed = new EmbedBuilder()
            .setColor('#00AAFF')
            .setTitle(title || 'Thanks for Adding HoYo Code Sender!')
            .setDescription(
                description
                || "Thanks for adding me to your server! I'll help you get HoYoverse game codes automatically."
            )
            .addFields(
                {
                    name: setupHeader || '🔧 Quick Setup Guide',
                    value: setupSteps
                        || '1. Run `/setup` to configure notification channel & roles\n'
                        + '2. (Optional) Use `/favgames` to select which games to receive notifications for\n'
                        + '3. (Optional) Change the language with `/setlang`\n\n'
                        + "That's it! I'll now automatically send new game codes to your configured channel."
                },
                {
                    name: '💡 Tip',
                    value: helpTip || 'For more information and tips, run `/help` anytime.'
                }
            )
            .setFooter({
                text: footer || 'HoYo Code Sender - Get your game codes automatically!'
            })
            .setTimestamp();

        const botMember = guild.members?.me || client.user;

        // Priority: system channel > bot/setup channels > first writable text channel
        let targetChannel = guild.systemChannel;

        if (!targetChannel || !canSendToChannel(targetChannel, botMember)) {
            targetChannel = null;
            const channelNames = ['bot-commands', 'bot', 'setup'];

            for (const name of channelNames) {
                const channel = guild.channels.cache.find(ch =>
                    ch.name?.toLowerCase().includes(name)
                    && ch.type === 0
                    && canSendToChannel(ch, botMember)
                );

                if (channel) {
                    targetChannel = channel;
                    break;
                }
            }

            if (!targetChannel) {
                targetChannel = guild.channels.cache.find(ch =>
                    ch.type === 0 && canSendToChannel(ch, botMember)
                );
            }
        }

        let sentInChannel = false;
        if (targetChannel) {
            try {
                await targetChannel.send({
                    content: guild.ownerId ? `<@${guild.ownerId}>` : undefined,
                    embeds: [welcomeEmbed],
                    allowedMentions: {
                        parse: [],
                        users: guild.ownerId ? [guild.ownerId] : []
                    }
                });
                sentInChannel = true;
                console.log(`Sent welcome message to ${guild.name} in #${targetChannel.name}`);
            } catch (sendError) {
                console.warn(
                    `Could not send welcome message to #${targetChannel.name} in ${guild.name}:`,
                    sendError.message
                );
            }
        }

        if (!sentInChannel && guild.ownerId) {
            console.log(`Could not send welcome message in ${guild.name}, attempting to DM owner`);

            try {
                const owner = await client.users.fetch(guild.ownerId);
                if (owner) {
                    welcomeEmbed.addFields({
                        name: 'ℹ️ Note',
                        value: dmInfo
                            || "I couldn't find a suitable channel to send the welcome message in your server, so I'm sending it to you directly."
                    });

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
 * Check if the bot can send embedded messages to a channel
 */
function canSendToChannel(channel, botMember) {
    if (!channel || !botMember || typeof channel.permissionsFor !== 'function') {
        return false;
    }
    const permissions = channel.permissionsFor(botMember);
    return Boolean(
        permissions && permissions.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks
        ])
    );
}

module.exports = { sendWelcomeMessage, canSendToChannel };
