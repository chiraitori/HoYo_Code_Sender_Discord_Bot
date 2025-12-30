const Config = require('../models/Config');
const Settings = require('../models/Settings');
const YearMessage = require('../models/YearMessage');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

async function checkAndSendYearChangeMessage(client) {
    try {
        // Get current year in Vietnam timezone (Asia/Ho_Chi_Minh = UTC+7)
        const vietnamTime = new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric'
        });
        const currentYear = parseInt(vietnamTime);

        console.log(`Checking for year change messages (current year in Vietnam: ${currentYear})...`);

        // Only send messages for 2026 and beyond
        if (currentYear < 2026) {
            console.log('Year is before 2026, skipping year change messages.');
            return;
        }

        // Get all guild configurations and settings
        const [configs, allSettings, yearMessages] = await Promise.all([
            Config.find({}).lean(),
            Settings.find({}).lean(),
            YearMessage.find({}).lean()
        ]);

        // Create lookup maps
        const settingsMap = allSettings.reduce((map, setting) => {
            map[setting.guildId] = setting;
            return map;
        }, {});

        const yearMessageMap = yearMessages.reduce((map, yearMsg) => {
            map[yearMsg.guildId] = yearMsg;
            return map;
        }, {});

        const messageTasks = [];

        // Process each configuration
        for (const config of configs) {
            const guildId = config.guildId;
            const settings = settingsMap[guildId];
            const yearMessage = yearMessageMap[guildId];

            // Check if bot is still in the guild
            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                continue;
            }

            // Skip if autoSend is disabled
            if (!settings?.autoSendEnabled) {
                continue;
            }

            // Check if we've already sent the message for this year
            if (yearMessage && yearMessage.lastYearSent >= currentYear) {
                continue;
            }

            // Send the year change message
            messageTasks.push(sendYearChangeMessage(client, config, guildId, currentYear));
        }

        // Send all messages
        if (messageTasks.length > 0) {
            console.log(`Sending year change messages to ${messageTasks.length} guilds...`);
            await Promise.allSettled(messageTasks);
        } else {
            console.log('No year change messages to send.');
        }

    } catch (error) {
        console.error('Error in checkAndSendYearChangeMessage:', error);
    }
}

async function sendYearChangeMessage(client, config, guildId, currentYear) {
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return;
        }

        // Get the notification channel
        const channel = client.channels.cache.get(config.channel);
        if (!channel) {
            console.log(`No channel found for guild ${guildId}, skipping year message`);
            return;
        }

        // Check if channel is text-based
        if (!channel.isTextBased()) {
            return;
        }

        // Check bot permissions
        const botMember = guild.members.cache.get(client.user.id);
        if (!botMember) {
            return;
        }

        const channelPermissions = channel.permissionsFor(botMember);
        if (!channelPermissions || !channelPermissions.has(PermissionFlagsBits.SendMessages)) {
            console.log(`Missing SendMessages permission in guild ${guildId}, skipping year message`);
            return;
        }

        if (!channelPermissions.has(PermissionFlagsBits.EmbedLinks)) {
            console.log(`Missing EmbedLinks permission in guild ${guildId}, skipping year message`);
            return;
        }

        // Create the embed message
        const embed = new EmbedBuilder()
            .setColor('#FFD700') // Gold/festive color
            .setTitle(`🎉 Happy New Year ${currentYear}!`)
            .setDescription(
                `Whether this message reaches you a bit early or a little late, as we step into ${currentYear}, I just want to say a huge thank you to everyone.\n\n` +
                `Honestly, this bot started out as a simple project just for my close friends. I uploaded it to top.gg mainly for fun, never expecting it to blow up like this. Seeing so many invites and people using it has been a huge surprise, and I am truly grateful for every single one of you.\n\n` +
                `My promise for this new year is to work hard on stability and bring you guys some exciting new features in the coming months. Thank you for being part of this journey.\n\n` +
                `Happy New Year! I'm [Chiraitori](https://chiraitori.dev), the creator of this bot.`
            )
            .setFooter({ text: 'Chiraitori', url: 'https://chiraitori.dev' })
            .setTimestamp();

        // Send the message (no role mentions)
        await channel.send({ embeds: [embed] });

        // Update the database to mark this year as sent
        await YearMessage.findOneAndUpdate(
            { guildId: guildId },
            {
                lastYearSent: currentYear,
                sentAt: new Date()
            },
            { upsert: true, new: true }
        );

        console.log(`Successfully sent year ${currentYear} message to guild ${guildId}`);

    } catch (error) {
        console.error(`Error sending year message to guild ${guildId}:`, error);
    }
}

module.exports = { checkAndSendYearChangeMessage };
