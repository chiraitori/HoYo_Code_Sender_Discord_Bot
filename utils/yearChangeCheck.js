const Config = require('../models/Config');
const Settings = require('../models/Settings');
const YearMessage = require('../models/YearMessage');
const Language = require('../models/Language');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

async function checkAndSendYearChangeMessage(client) {
    try {
        // Get current year in Vietnam timezone (Asia/Ho_Chi_Minh = UTC+7)
        // Get current date in Vietnam time
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });

        const parts = formatter.formatToParts(new Date());
        const day = parts.find(p => p.type === 'day').value;
        const month = parts.find(p => p.type === 'month').value;
        const yearStr = parts.find(p => p.type === 'year').value;
        const currentYear = parseInt(yearStr);

        // Check if today is January 1st
        if (month !== '1' || day !== '1') {
            // Uncomment to debug date checking
            // console.log(`Not Jan 1st (Today is ${month}/${day}), skipping year change check.`);
            return;
        }

        console.log(`It's Jan 1st! Checking for year change messages for ${currentYear}...`);

        // Only send messages for 2026 and beyond
        if (currentYear < 2026) {
            console.log('Year is before 2026, skipping year change messages.');
            return;
        }

        // Get all guild configurations, settings, and languages
        const [configs, allSettings, yearMessages, languages] = await Promise.all([
            Config.find({}).lean(),
            Settings.find({}).lean(),
            YearMessage.find({}).lean(),
            Language.find({}).lean()
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

        const languageMap = languages.reduce((map, lang) => {
            map[lang.guildId] = lang.language || 'en';
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
            const guildLanguage = languageMap[guildId] || 'en';
            messageTasks.push(sendYearChangeMessage(client, config, guildId, currentYear, guildLanguage));
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

async function sendYearChangeMessage(client, config, guildId, currentYear, language) {
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

        // Prepare message content based on language
        let title, description;

        if (language === 'vi') {
            // Vietnamese message
            title = `🎉 Chúc mừng năm mới ${currentYear}!`;
            description =
                `Dù lời nhắn này đến với mọi người có hơi sớm hay hơi trễ một chút, thì khoảnh khắc bước sang năm ${currentYear} này, mình muốn gửi một lời cảm ơn to lớn đến tất cả các bạn.\n\n` +
                `Thú thật là, ban đầu con bot này chỉ là một dự án nhỏ mình làm để cho bạn bè dùng thôi, rồi up lên top.gg cho vui. Mình chưa bao giờ nghĩ là nó sẽ được nhiều người biết đến và mời về server nhiều đến thế! Sự ủng hộ của mọi người thực sự là một bất ngờ quá lớn và mình vô cùng biết ơn vì điều đó.\n\n` +
                `Năm mới này, mình xin hứa sẽ cố gắng làm việc chăm chỉ hơn để bot hoạt động ổn định và mang đến những tính năng mới xịn sò trong vài tháng tới. Cảm ơn mọi người đã đồng hành cùng mình.\n\n` +
                `Chúc mừng năm mới! Mình là [Chiraitori](https://chiraitori.dev), người đã tạo ra con bot này.`;
        } else {
            // English message (default)
            title = `🎉 Happy New Year ${currentYear}!`;
            description =
                `Whether this message reaches you a bit early or a little late, as we step into ${currentYear}, I just want to say a huge thank you to everyone.\n\n` +
                `Honestly, this bot started out as a simple project just for my close friends. I uploaded it to top.gg mainly for fun, never expecting it to blow up like this. Seeing so many invites and people using it has been a huge surprise, and I am truly grateful for every single one of you.\n\n` +
                `My promise for this new year is to work hard on stability and bring you guys some exciting new features in the coming months. Thank you for being part of this journey.\n\n` +
                `Happy New Year! I'm [Chiraitori](https://chiraitori.dev), the creator of this bot.`;
        }

        // Create the embed message
        const embed = new EmbedBuilder()
            .setColor('#FFD700') // Gold/festive color
            .setTitle(title)
            .setDescription(description)
            .setFooter({ text: 'https://chiraitori.dev' })
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
