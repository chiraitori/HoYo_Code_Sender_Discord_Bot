const Config = require('../models/Config');
const Settings = require('../models/Settings');
const YearMessage = require('../models/YearMessage');
const Language = require('../models/Language');
const { EmbedBuilder } = require('discord.js');
const { sendChannelMessage } = require('./discordMessageSender');
const { getKnownGuildIds } = require('./clusterGuilds');
const { getLatestGuildRecords } = require('./guildRecords');

const YEAR_MESSAGE_BATCH_SIZE = 25;
let yearCheckRunning = false;

async function claimYearMessage(guildId, currentYear) {
    try {
        const claimed = await YearMessage.findOneAndUpdate(
            { guildId, lastYearSent: { $lt: currentYear } },
            { $set: { lastYearSent: currentYear, sentAt: new Date() } },
            { new: true }
        );
        if (claimed) {
            return { claimed: true, previousYear: null, inserted: false };
        }

        const existing = await YearMessage.findOne({ guildId }).lean();
        if (existing && existing.lastYearSent >= currentYear) {
            return { claimed: false, previousYear: existing.lastYearSent, inserted: false };
        }

        await YearMessage.create({
            guildId,
            lastYearSent: currentYear,
            sentAt: new Date()
        });
        return { claimed: true, previousYear: null, inserted: true };
    } catch (error) {
        if (error?.code === 11000) {
            return { claimed: false, previousYear: null, inserted: false };
        }
        throw error;
    }
}

async function processInBatches(tasks, batchSize = YEAR_MESSAGE_BATCH_SIZE) {
    const results = [];
    for (let i = 0; i < tasks.length; i += batchSize) {
        results.push(...await Promise.allSettled(
            tasks.slice(i, i + batchSize).map(task => task())
        ));
    }
    return results;
}

async function checkAndSendYearChangeMessage(client) {
    if (yearCheckRunning) {
        return;
    }

    yearCheckRunning = true;
    try {
        // Get current year in Vietnam timezone (Asia/Ho_Chi_Minh = UTC+7)
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
        const currentYear = parseInt(yearStr, 10);

        // Check if today is January 1st
        if (month !== '1' || day !== '1') {
            return;
        }

        console.log(`It's Jan 1st! Checking for year change messages for ${currentYear}...`);

        // Only send messages for 2026 and beyond
        if (currentYear < 2026) {
            console.log('Year is before 2026, skipping year change messages.');
            return;
        }

        // Get all guild configurations, settings, languages, and known guilds
        const [rawConfigs, rawSettings, yearMessages, languages, knownGuildIds] = await Promise.all([
            Config.find({}).sort({ _id: 1 }).lean(),
            Settings.find({}).sort({ _id: 1 }).lean(),
            YearMessage.find({}).lean(),
            Language.find({}).lean(),
            getKnownGuildIds(client)
        ]);
        const configs = getLatestGuildRecords(rawConfigs);
        const allSettings = getLatestGuildRecords(rawSettings);

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
            if (!knownGuildIds.has(guildId)) {
                continue;
            }

            const settings = settingsMap[guildId];
            const yearMessage = yearMessageMap[guildId];

            // Skip only if autoSend is explicitly disabled (default-on for legacy guilds)
            if (settings?.autoSendEnabled === false) {
                continue;
            }

            // Check if we've already sent the message for this year
            if (yearMessage && yearMessage.lastYearSent >= currentYear) {
                continue;
            }

            const guildLanguage = languageMap[guildId] || 'en';
            messageTasks.push(() => sendYearChangeMessage(client, config, guildId, currentYear, guildLanguage));
        }

        // Send all messages in rate-limit-safe batches
        if (messageTasks.length > 0) {
            console.log(`Sending year change messages to ${messageTasks.length} guilds...`);
            await processInBatches(messageTasks, YEAR_MESSAGE_BATCH_SIZE);
        } else {
            console.log('No year change messages to send.');
        }

    } catch (error) {
        console.error('Error in checkAndSendYearChangeMessage:', error);
    } finally {
        yearCheckRunning = false;
    }
}

async function sendYearChangeMessage(client, config, guildId, currentYear, language) {
    try {
        const channelId = typeof config.channel === 'string' ? config.channel.trim() : '';
        if (!channelId) {
            console.log(`No channel found for guild ${guildId}, skipping year message`);
            return;
        }

        const claim = await claimYearMessage(guildId, currentYear);
        if (!claim.claimed) {
            return;
        }

        // Prepare message content based on language
        let title, description;

        if (language === 'vi') {
            title = `🎉 Chúc mừng năm mới ${currentYear}!`;
            description =
                `Dù lời nhắn này đến với mọi người có hơi sớm hay hơi trễ một chút, thì khoảnh khắc bước sang năm ${currentYear} này, mình muốn gửi một lời cảm ơn to lớn đến tất cả các bạn.\n\n` +
                `Thú thật là, ban đầu con bot này chỉ là một dự án nhỏ mình làm để cho bạn bè dùng thôi, rồi up lên top.gg cho vui. Mình chưa bao giờ nghĩ là nó sẽ được nhiều người biết đến và mời về server nhiều đến thế! Sự ủng hộ của mọi người thực sự là một bất ngờ quá lớn và mình vô cùng biết ơn vì điều đó.\n\n` +
                `Năm mới này, mình xin hứa sẽ cố gắng làm việc chăm chỉ hơn để bot hoạt động ổn định và mang đến những tính năng mới xịn sò trong vài tháng tới. Cảm ơn mọi người đã đồng hành cùng mình.\n\n` +
                `Chúc mừng năm mới! Mình là [Chiraitori](https://chiraitori.dev), người đã tạo ra con bot này.`;
        } else {
            title = `🎉 Happy New Year ${currentYear}!`;
            description =
                `Whether this message reaches you a bit early or a little late, as we step into ${currentYear}, I just want to say a huge thank you to everyone.\n\n` +
                `Honestly, this bot started out as a simple project just for my close friends. I uploaded it to top.gg mainly for fun, never expecting it to blow up like this. Seeing so many invites and people using it has been a huge surprise, and I am truly grateful for every single one of you.\n\n` +
                `My promise for this new year is to work hard on stability and bring you guys some exciting new features in the coming months. Thank you for being part of this journey.\n\n` +
                `Happy New Year! I'm [Chiraitori](https://chiraitori.dev), the creator of this bot.`;
        }

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(title)
            .setDescription(description)
            .setFooter({ text: 'https://chiraitori.dev' })
            .setTimestamp();

        await sendChannelMessage(client, channelId, { embeds: [embed] }, {
            preferRest: true,
            guildId,
            dedupeKey: `year:${currentYear}:${channelId}`
        });

        console.log(`Successfully sent year ${currentYear} message to guild ${guildId}`);

    } catch (error) {
        console.error(`Error sending year message to guild ${guildId}:`, error);
    }
}

module.exports = { checkAndSendYearChangeMessage };
