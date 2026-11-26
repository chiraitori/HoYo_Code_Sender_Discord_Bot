const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const Config = require('../models/Config');
const Settings = require('../models/Settings');
const languageManager = require('../utils/language');
const { hasAdminPermission } = require('../utils/permissions');
const { validateChannel } = require('../utils/channelValidator');
const { handleDMRestriction } = require('../utils/dmHandler');
const { getRoleMention } = require('../utils/roleMention');

// Game information mapping
const gameNames = {
    'genshin': 'Genshin Impact',
    'hkrpg': 'Honkai: Star Rail',
    'nap': 'Zenless Zone Zero'
};

const gameEmojis = {
    'genshin': '<:genshin:1368073403231375430>',
    'hkrpg': '<:hsr:1368073099756703794>',
    'nap': '<:zzz:1368073452174704763>'
};

const redeemUrls = {
    'genshin': 'https://genshin.hoyoverse.com/en/gift',
    'hkrpg': 'https://hsr.hoyoverse.com/gift',
    'nap': 'https://zenless.hoyoverse.com/redemption'
};

const roleMapping = {
    'genshin': 'genshinRole',
    'hkrpg': 'hsrRole',
    'nap': 'zzzRole'
};

// Demo codes for each game
const demoCodes = {
    'genshin': [
        { code: 'GENSHINDEMO123', rewards: 'Primogems ×60, Mora ×10000' },
        { code: 'GSDEMO456', rewards: 'Hero\'s Wit ×5, Mystic Enhancement Ore ×10' }
    ],
    'hkrpg': [
        { code: 'HSRDEMO123', rewards: 'Stellar Jade ×60, Credits ×10000' },
        { code: 'HSRDEMO456', rewards: 'Traveler\'s Guide ×5, Refined Aether ×10' }
    ],
    'nap': [
        { code: 'ZZZDEMO123', rewards: 'Poly ×60, Master Tapes ×10000' },
        { code: 'ZZZDEMO456', rewards: 'Level Up Material ×5, Weapon Enhancement Material ×10' }
    ]
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('demoautosend')
        .setDescription('Send sample code notifications to test your channel setup')
        .addStringOption(option =>
            option.setName('game')
                .setDescription('Select game for demo codes')
                .setRequired(true)
                .addChoices(
                    { name: 'Genshin Impact', value: 'genshin' },
                    { name: 'Honkai: Star Rail', value: 'hkrpg' },
                    { name: 'Zenless Zone Zero', value: 'nap' },
                    { name: 'All Games', value: 'all' }
                )),

    async execute(interaction) {
        // Check if command is used in DMs
        if (await handleDMRestriction(interaction, 'demoautosend')) {
            return;
        }

        // Check if user is admin
        if (!hasAdminPermission(interaction)) {
            const noPermMessage = await languageManager.getString(
                'commands.demoautosend.noPermission',
                interaction.guildId
            ) || 'You need administrator permissions to use this command.';
            return interaction.reply({ content: noPermMessage, flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            // Get guild configuration
            const config = await Config.findOne({ guildId: interaction.guildId }).sort({ _id: -1 });
            if (!config || !config.channel) {
                const noConfigMessage = await languageManager.getString(
                    'commands.demoautosend.noConfig',
                    interaction.guildId
                ) || 'Bot is not set up yet! Please use `/setup` first to configure a channel.';
                return interaction.editReply({ content: noConfigMessage });
            }

            // Validate the channel
            const validationResult = await validateChannel(interaction.client, interaction.guildId);
            if (!validationResult.isValid) {
                const channelErrorMsg = await languageManager.getString(
                    'commands.demoautosend.channelError',
                    interaction.guildId
                ) || 'Cannot send messages to the configured channel:';

                return interaction.editReply({
                    content: `${channelErrorMsg} ${validationResult.error}`
                });
            }

            // Get settings to check where to send
            const settings = await Settings.findOne({ guildId: interaction.guildId }).sort({ _id: -1 });
            const sendToChannel = settings?.autoSendOptions?.channel !== false;
            const sendToThreads = settings?.autoSendOptions?.threads !== false;

            const selectedGame = interaction.options.getString('game');
            const gamesToProcess = selectedGame === 'all'
                ? ['genshin', 'hkrpg', 'nap']
                : [selectedGame];

            const channel = validationResult.channel || interaction.client.channels.cache.get(config.channel);
            const botMember = interaction.guild.members.me
                || await interaction.guild.members.fetchMe().catch(() => null);
            const sentMessages = [];
            let successCount = 0;

            const threadMapping = {
                'genshin': config.forumThreads?.genshin,
                'hkrpg': config.forumThreads?.hsr,
                'nap': config.forumThreads?.zzz
            };

            for (const game of gamesToProcess) {
                const baseTitle = await languageManager.getString(
                    'commands.demoautosend.title',
                    interaction.guildId,
                    { game: gameNames[game] }
                ) || `🔔 Demo ${gameNames[game]} Codes!`;
                const title = `${gameEmojis[game]} ${baseTitle}`;

                const redeemText = await languageManager.getString(
                    'commands.listcodes.redeemButton',
                    interaction.guildId
                ) || 'Redeem';

                const descriptions = [];
                for (const code of demoCodes[game]) {
                    const rewardString = await languageManager.getRewardString(code.rewards, interaction.guildId)
                        || `Reward: ${code.rewards}`;

                    descriptions.push(
                        `**${code.code}** (DEMO)\n` +
                        `[${redeemText}](${redeemUrls[game]}?code=${code.code})\n` +
                        `└ ${rewardString}`
                    );
                }

                const finalDescription = descriptions.join('\n\n');
                const supportMsg = await languageManager.getSupportFooter(interaction.guildId);

                const embed = new EmbedBuilder()
                    .setColor('#FF9900')
                    .setTitle(title)
                    .setDescription(finalDescription)
                    .setFooter({
                        text: supportMsg,
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();

                embed.addFields({
                    name: await languageManager.getString('commands.demoautosend.notice', interaction.guildId) || '⚠️ Demo Notice',
                    value: await languageManager.getString('commands.demoautosend.noticeText', interaction.guildId) ||
                        'These are demo codes for testing purposes only. They will not work in-game.'
                });

                const roleField = roleMapping[game];
                const roleId = config[roleField];
                const roleMention = getRoleMention(roleId);

                // Send to main channel if enabled
                if (sendToChannel && channel) {
                    try {
                        const sentMessage = await channel.send({
                            content: roleMention.content,
                            embeds: [embed],
                            allowedMentions: roleMention.allowedMentions
                        });
                        successCount++;
                        sentMessages.push(`${gameNames[game]} (Channel): <${sentMessage.url}>`);
                    } catch (error) {
                        console.error(`[DemoAutoSend] Error sending to channel for ${game}:`, error);
                        sentMessages.push(`${gameNames[game]} (Channel): ❌ Failed`);
                    }
                }

                // Send to forum thread if enabled, configured, and distinct from main channel
                const threadId = threadMapping[game];
                if (sendToThreads && threadId && threadId !== config.channel) {
                    try {
                        const thread = await interaction.client.channels.fetch(threadId).catch(() => null);
                        if (thread) {
                            const permissions = botMember ? thread.permissionsFor?.(botMember) : null;
                            if (permissions && permissions.has([
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessagesInThreads,
                                PermissionFlagsBits.EmbedLinks
                            ])) {
                                const sentMessage = await thread.send({
                                    content: roleMention.content,
                                    embeds: [embed],
                                    allowedMentions: roleMention.allowedMentions
                                });
                                successCount++;
                                sentMessages.push(`${gameNames[game]} (Thread): <${sentMessage.url}>`);
                            } else {
                                console.log(`[DemoAutoSend] Missing permissions for ${game} thread`);
                                sentMessages.push(`${gameNames[game]} (Thread): ❌ Missing permissions`);
                            }
                        } else {
                            console.log(`[DemoAutoSend] Thread not found for ${game}`);
                            sentMessages.push(`${gameNames[game]} (Thread): ❌ Not found`);
                        }
                    } catch (error) {
                        console.error(`[DemoAutoSend] Error sending to thread for ${game}:`, error);
                        sentMessages.push(`${gameNames[game]} (Thread): ❌ Error - ${error.message}`);
                    }
                }
            }

            const successMessage = await languageManager.getString(
                'commands.demoautosend.success',
                interaction.guildId,
                { count: successCount }
            ) || `Successfully sent demo codes for ${successCount} destination(s)!`;

            await interaction.editReply({
                content: `${successMessage}\n\n${sentMessages.join('\n')}`
            });

        } catch (error) {
            console.error('Error sending demo codes:', error);
            const errorMessage = await languageManager.getString(
                'commands.demoautosend.error',
                interaction.guildId
            ) || 'An error occurred while sending demo codes.';

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    content: `${errorMessage}\n\`\`\`${error.message}\`\`\``
                });
            } else {
                await interaction.reply({
                    content: `${errorMessage}\n\`\`\`${error.message}\`\`\``,
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
};
