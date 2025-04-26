const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Config = require('../models/Config');
const languageManager = require('../utils/language');

const gameNames = {
    'genshin': 'Genshin Impact',
    'hsr': 'Honkai: Star Rail',
    'zzz': 'Zenless Zone Zero'
};

const postcodeUrls = {
    'genshin': 'https://genshin.hoyoverse.com/en/gift',
    'hsr': 'https://hsr.hoyoverse.com/gift',
    'zzz': 'https://zzz.hoyoverse.com/gift'
};

const roleMappings = {
    'genshin': 'genshinRole',
    'hsr': 'hsrRole',
    'zzz': 'zzzRole'
};


module.exports = {
    data: new SlashCommandBuilder()
        .setName('postcode')
        .setDescription('Show post postcode codes for Genshin Impact, Honkai: Star Rail, and Zenless Zone Zero')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Add strict permission check
            if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
                const noPermMessage = await languageManager.getString(
                    'commands.postcode.noPermission',
                    interaction.guildId
                );
                return interaction.reply({ content: noPermMessage, ephemeral: true });
            }

            // Get translated modal title
            const modalTitle = await languageManager.getString(
                'commands.postcode.modalTitle',
                interaction.guildId
            );

            const modal = new ModalBuilder()
                .setCustomId('postcodeModal')
                .setTitle(modalTitle);

            // Get translated input labels
            const labels = await Promise.all([
                languageManager.getString('commands.postcode.inputLabels.games', interaction.guildId),
                languageManager.getString('commands.postcode.inputLabels.code1', interaction.guildId),
                languageManager.getString('commands.postcode.inputLabels.code2', interaction.guildId),
                languageManager.getString('commands.postcode.inputLabels.code3', interaction.guildId),
                languageManager.getString('commands.postcode.inputLabels.message', interaction.guildId)
            ]);

            const gameInput = new TextInputBuilder()
                .setCustomId('game')
                .setLabel(labels[0])
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const codeInput1 = new TextInputBuilder()
                .setCustomId('code1')
                .setLabel(labels[1])
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const codeInput2 = new TextInputBuilder()
                .setCustomId('code2')
                .setLabel(labels[2])
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            const codeInput3 = new TextInputBuilder()
                .setCustomId('code3')
                .setLabel(labels[3])
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            const messageInput = new TextInputBuilder()
                .setCustomId('message')
                .setLabel(labels[4])
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false)
                .setMaxLength(1000);

            const rows = [gameInput, codeInput1, codeInput2, codeInput3, messageInput]
                .map(input => new ActionRowBuilder().addComponents(input));

            modal.addComponents(...rows);
            await interaction.showModal(modal);

        } catch (error) {
            console.error('Error showing postcode modal:', error);
            const errorMessage = await languageManager.getString(
                'commands.postcode.error',
                interaction.guildId
            );
            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    },

    async modalSubmit(interaction) {
        try {
            const game = interaction.fields.getTextInputValue('game').toLowerCase();
            const code1 = interaction.fields.getTextInputValue('code1');
            const code2 = interaction.fields.getTextInputValue('code2');
            const code3 = interaction.fields.getTextInputValue('code3');
            const message = interaction.fields.getTextInputValue('message');

            const codes = [code1];
            if (code2) codes.push(code2);
            if (code3) codes.push(code3);

            // Get config from database
            const config = await Config.findOne({ guildId: interaction.guild.id });
            if (!config || !config.channel) {
                const noConfigMessage = await languageManager.getString(
                    'errors.noConfig',
                    interaction.guildId
                );
                return interaction.reply({ content: noConfigMessage, ephemeral: true });
            }

            const channel = interaction.guild.channels.cache.get(config.channel);
            if (!channel) {
                const invalidChannelMessage = await languageManager.getString(
                    'errors.invalidChannel',
                    interaction.guildId
                );
                return interaction.reply({ content: invalidChannelMessage, ephemeral: true });
            }

            // Create embed with translated content
            const embedTitle = await languageManager.getString(
                'commands.postcode.embedTitle',
                interaction.guildId,
                { game: gameNames[game] }
            );

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(embedTitle)
                .setDescription(await (async () => {
                    const descriptions = [];
                    for (const code of codes) {
                        const postcodeButton = await languageManager.getString('commands.postcode.postcodeButton', interaction.guildId);
                        descriptions.push(`**${code}**\n[${postcodeButton}](${postcodeUrls[game]}?code=${code})`);
                    }
                    return descriptions.join('\n\n');
                })());

            if (message) {
                const messageLabel = await languageManager.getString('commands.postcode.messageLabel', interaction.guildId);
                embed.addFields({ name: messageLabel, value: message });
            }

            // Send message with role mention
            const roleId = config[roleMappings[game]];
            const roleTag = roleId ? `<@&${roleId}> ` : '';
            await channel.send({ content: roleTag, embeds: [embed] });

            // Send success message
            const successMessage = await languageManager.getString(
                'commands.postcode.success',
                interaction.guildId
            );
            await interaction.reply({ content: successMessage, ephemeral: true });

        } catch (error) {
            console.error('Error processing postcode:', error);
            const errorMessage = await languageManager.getString(
                'commands.postcode.error',
                interaction.guildId
            );
            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    }
};
