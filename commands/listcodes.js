const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    MessageFlags
} = require('discord.js');
const axios = require('axios');
const languageManager = require('../utils/language');
const { enrichCodesWithHoyolabRewards } = require('../utils/codeRewardEnricher');
const { getHoyolabExchangeCodes, mergeExchangeCodes } = require('../utils/hoyolabExchangeCodes');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listcodes')
        .setDescription('List all active codes for a game')
        .addStringOption(option =>
            option.setName('game')
                .setDescription('Select game')
                .setRequired(true)
                .addChoices(
                    { name: 'Genshin Impact', value: 'genshin' },
                    { name: 'Honkai: Star Rail', value: 'hkrpg' },
                    { name: 'Zenless Zone Zero', value: 'nap' }
                )),

    async execute(interaction) {
        try {
            const game = interaction.options.getString('game');

            // Get translated messages using correct key
            const loadingMessage = await languageManager.getString('commands.listcodes.loading', interaction.guildId);
            // Make the response ephemeral (visible only to the user who used the command)
            await interaction.reply({ content: loadingMessage, flags: MessageFlags.Ephemeral });

            const primaryResponse = await axios.get(`https://hoyo-codes.seria.moe/codes?game=${game}`, {
                timeout: 10000, // 10 second timeout
                headers: {
                    'User-Agent': 'HoYo-Code-Sender-Bot/1.0'
                }
            }).catch(error => {
                console.error(`[listcodes] Primary API failed for ${game}:`, error.message);
                return { data: { codes: [] }, error: true };
            });

            const primaryCodes = Array.isArray(primaryResponse.data?.codes)
                ? primaryResponse.data.codes
                : [];
            const hoyolabCodes = await getHoyolabExchangeCodes(game);
            const mergedCodes = mergeExchangeCodes(game, primaryCodes, hoyolabCodes);
            const activeCodes = await enrichCodesWithHoyolabRewards(
                game,
                mergedCodes.filter(code => code.status === 'OK')
            );

            // Get game choice
            const gameNames = {
                'genshin': 'Genshin Impact',
                'hkrpg': 'Honkai: Star Rail',
                'nap': 'Zenless Zone Zero'
            };

            // Get game emojis
            const gameEmojis = {
                'genshin': '<:genshin:1368073403231375430>',
                'hkrpg': '<:hsr:1368073099756703794>',
                'nap': '<:zzz:1368073452174704763>'
            };

            if (!activeCodes.length) {
                if (primaryResponse.error) {
                    const fetchErrorMessage = await languageManager.getString(
                        'commands.listcodes.error.fetch',
                        interaction.guildId
                    );
                    return await interaction.editReply({ content: fetchErrorMessage });
                }

                const noCodesMessage = await languageManager.getString(
                    'commands.listcodes.noCodes',
                    interaction.guildId,
                    { game: gameNames[game] }
                );
                return await interaction.editReply({ content: noCodesMessage });
            }

            let title = await languageManager.getString(
                'commands.listcodes.title',
                interaction.guildId,
                { game: gameNames[game] }
            );

            // Add emoji to title
            title = `${gameEmojis[game]} ${title}`;

            const redeemUrls = {
                'genshin': 'https://genshin.hoyoverse.com/en/gift',
                'hkrpg': 'https://hsr.hoyoverse.com/gift',
                'nap': 'https://zenless.hoyoverse.com/redemption'
            };

            // Get translated strings in advance
            const redeemHeader = await languageManager.getString('commands.listcodes.redeemHeader', interaction.guildId);
            const redeemButtonText = await languageManager.getString('commands.listcodes.redeemButton', interaction.guildId);
            const noRewardText = await languageManager.getString('commands.listcodes.noReward', interaction.guildId);
            const previousText = '◀️';
            const nextText = '▶️';

            // Create code entries
            const codeEntries = await Promise.all(activeCodes
                .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))
                .map(async code => {
                    const rewardText = code.rewards ?
                        await languageManager.getRewardString(code.rewards, interaction.guildId) :
                        noRewardText;

                    return `**${code.code}**\n` +
                        `${rewardText}\n` +
                        `[${redeemButtonText}](${redeemUrls[game]}?code=${encodeURIComponent(code.code)})`;
                }));

            // Split into pages if needed
            const pages = [];
            let currentPage = [];
            let currentLength = 0;
            const MAX_LENGTH = 4000; // Keep some buffer below 4096

            for (const entry of codeEntries) {
                const entryLength = entry.length + 2; // +2 for '\n\n'

                if (currentLength + entryLength > MAX_LENGTH && currentPage.length > 0) {
                    pages.push(currentPage.join('\n\n'));
                    currentPage = [entry];
                    currentLength = entryLength;
                } else {
                    currentPage.push(entry);
                    currentLength += entryLength;
                }
            }

            if (currentPage.length > 0) {
                pages.push(currentPage.join('\n\n'));
            }

            // Create embeds for each page
            const supportMsg = await languageManager.getSupportFooter(
                interaction.guildId
            );

            const embeds = pages.map((pageContent, index) => {
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(title)
                    .setDescription(pageContent)
                    .setFooter({ text: supportMsg })
                    .setTimestamp();

                // Only add the redeem URL field to the last embed
                if (index === pages.length - 1) {
                    embed.addFields({ name: redeemHeader, value: redeemUrls[game] });
                }

                return embed;
            });

            // If there's only one page, no need for pagination buttons
            if (pages.length === 1) {
                return await interaction.editReply({
                    content: null,
                    embeds: [embeds[0]]
                });
            }

            // Create pagination buttons with page indicator
            const createButtons = (pageIndex) => {
                const row = new ActionRowBuilder();

                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel(previousText)
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(pageIndex === 0)
                );

                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('page_indicator')
                        .setLabel(`${pageIndex + 1}/${pages.length}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel(nextText)
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(pageIndex === pages.length - 1)
                );

                return row;
            };

            let currentPageIndex = 0;

            const message = await interaction.editReply({
                content: null,
                embeds: [embeds[currentPageIndex]],
                components: [createButtons(currentPageIndex)]
            });

            const collector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 300000 // Expire after 5 minutes
            });

            collector.on('collect', async (i) => {
                try {
                    if (i.user.id !== interaction.user.id) {
                        const notYours = await languageManager.getString('common.notYourButton', interaction.guildId) ||
                            'This button is not for you.';
                        return await i.reply({ content: notYours, flags: MessageFlags.Ephemeral });
                    }

                    if (i.customId === 'prev') {
                        currentPageIndex = Math.max(0, currentPageIndex - 1);
                    } else if (i.customId === 'next') {
                        currentPageIndex = Math.min(embeds.length - 1, currentPageIndex + 1);
                    }

                    await i.update({
                        embeds: [embeds[currentPageIndex]],
                        components: [createButtons(currentPageIndex)]
                    });
                } catch (collectError) {
                    console.error('[listcodes] Pagination interaction error:', collectError);
                }
            });

            collector.on('end', async () => {
                try {
                    await interaction.editReply({
                        embeds: [embeds[currentPageIndex]],
                        components: []
                    });
                } catch (e) {
                    // Interaction token may already be expired after 15 minutes or message dismissed
                }
            });

        } catch (error) {
            console.error('Error in listcodes command:', error);
            try {
                const errorMessage = await languageManager.getString(
                    'commands.listcodes.error.fetch',
                    interaction.guildId
                );
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ content: errorMessage });
                } else {
                    await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
                }
            } catch (e) {
                console.error('Failed to send error message:', e);
            }
        }
    }
};
