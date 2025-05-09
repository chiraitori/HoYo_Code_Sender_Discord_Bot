const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const axios = require('axios');
const Code = require('../models/Code');
const languageManager = require('../utils/language');

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
            await interaction.reply({ content: loadingMessage, ephemeral: true });

            const response = await axios.get(`https://hoyo-codes.seria.moe/codes?game=${game}`);
            
            // Get game choice
            const gameNames = {
                'genshin': 'Genshin Impact',
                'hkrpg': 'Honkai: Star Rail',
                'nap': 'Zenless Zone Zero'
            };
            
            // Get game emojis - using simple dots instead of custom emojis
            const gameEmojis = {
                'genshin': '•',
                'hkrpg': '•',
                'nap': '•'
            };
            
            if (!response.data?.codes?.length) {
                const noCodesMessage = await languageManager.getString(
                    'commands.listcodes.noCodes', 
                    interaction.guildId,
                    { game: gameNames[game] }
                );
                // Keep the "no codes" message ephemeral too
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
            const pageText = await languageManager.getString('commands.listcodes.page', interaction.guildId) || 'Page';

            // Create code entries
            const codeEntries = await Promise.all(response.data.codes
                .sort((a, b) => b.id - a.id)
                .map(async code => {
                    const rewardText = code.rewards ? 
                        await languageManager.getRewardString(code.rewards, interaction.guildId) : 
                        noRewardText;
                        
                    return `**${code.code}**\n` +
                        `${rewardText}\n` +
                        `[${redeemButtonText}](${redeemUrls[game]}?code=${code.code})`;
                }));

            // Split into pages if needed
            const pages = [];
            let currentPage = [];
            let currentLength = 0;
            const MAX_LENGTH = 4000; // Keep some buffer below 4096

            for (const entry of codeEntries) {
                // Account for the newlines we'll add between entries
                const entryLength = entry.length + 2; // +2 for '\n\n'
                
                if (currentLength + entryLength > MAX_LENGTH && currentPage.length > 0) {
                    // This entry would exceed the limit, save current page and start a new one
                    pages.push(currentPage.join('\n\n'));
                    currentPage = [entry];
                    currentLength = entryLength;
                } else {
                    // Add to current page
                    currentPage.push(entry);
                    currentLength += entryLength;
                }
            }
            
            // Add the last page if there's anything left
            if (currentPage.length > 0) {
                pages.push(currentPage.join('\n\n'));
            }

            // Create embeds for each page
            const supportMsg = await languageManager.getString(
                'common.supportMsg', 
                interaction.guildId
            ) || '❤️ Support: ko-fi.com/chiraitori | paypal.me/chiraitori';
            
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
                    // Reply is already ephemeral from the initial reply
                });
            }

            // Create pagination buttons with page indicator
            const createButtons = (currentPage) => {
                const row = new ActionRowBuilder();
                
                // Previous button
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel(previousText)
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 0)
                );
                
                // Page indicator button (non-functional, just shows current page)
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('page_indicator')
                        .setLabel(`${currentPage + 1}/${pages.length}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true) // Always disabled as it's just an indicator
                );
                
                // Next button
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel(nextText)
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === pages.length - 1)
                );
                
                return row;
            };

            // Initial page
            let currentPageIndex = 0;
            
            // Send the first page with buttons
            const message = await interaction.editReply({
                content: null,
                embeds: [embeds[currentPageIndex]],
                components: [createButtons(currentPageIndex)]
                // Reply is already ephemeral from the initial reply
            });

            // Create button collector
            const collector = message.createMessageComponentCollector({ 
                componentType: ComponentType.Button,
                time: 300000 // Expire after 5 minutes
            });

            collector.on('collect', async (i) => {
                // Make sure only the person who ran the command can use the buttons
                if (i.user.id !== interaction.user.id) {
                    const notYours = await languageManager.getString('common.notYourButton', interaction.guildId) || 
                        'This button is not for you.';
                    return await i.reply({ content: notYours, ephemeral: true });
                }

                // Update page based on which button was pressed
                if (i.customId === 'prev') {
                    currentPageIndex--;
                } else if (i.customId === 'next') {
                    currentPageIndex++;
                }

                // Update the message with the new page and buttons
                await i.update({
                    embeds: [embeds[currentPageIndex]],
                    components: [createButtons(currentPageIndex)]
                });
            });

            collector.on('end', async () => {
                // Remove the buttons when the collector expires
                try {
                    await interaction.editReply({
                        embeds: [embeds[currentPageIndex]],
                        components: [] // Remove components
                    });
                } catch (e) {
                    console.error('Failed to remove buttons after timeout:', e);
                }
            });

        } catch (error) {
            console.error('Error:', error);
            try {
                const errorMessage = await languageManager.getString('commands.listcodes.error', interaction.guildId);
                if (interaction.replied) {
                    await interaction.editReply({ content: errorMessage });
                } else {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                }
            } catch (e) {
                console.error('Failed to send error message:', e);
            }
        }
    }
};