const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Config = require('../models/Config');
const languageManager = require('../utils/language');

const gameNames = {
    'genshin': 'Genshin Impact',
    'hsr': 'Honkai: Star Rail',
    'zzz': 'Zenless Zone Zero'
};

const redeemUrls = {
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
        .setName('redeem')
        .setDescription('Show redeem instructions and codes')
        .setDefaultMemberPermissions(PermissionFlagsBits.ADMINISTRATOR),

    async execute(interaction) {
        try {
            // Check if user is admin
            if (!interaction.member.permissions.has(PermissionFlagsBits.ADMINISTRATOR)) {
                const noPermMessage = await languageManager.getString(
                    'commands.redeem.noPermission',
                    interaction.guildId
                );
                return interaction.reply({ content: noPermMessage, ephemeral: true });
            }

            // Get translated modal title
            const modalTitle = await languageManager.getString(
                'commands.redeem.modalTitle',
                interaction.guildId
            );

            const modal = new ModalBuilder()
                .setCustomId('redeemModal')
                .setTitle(modalTitle);

            // Get translated input labels
            const labels = await Promise.all([
                languageManager.getString('commands.redeem.inputLabels.games', interaction.guildId),
                languageManager.getString('commands.redeem.inputLabels.code1', interaction.guildId),
                languageManager.getString('commands.redeem.inputLabels.code2', interaction.guildId),
                languageManager.getString('commands.redeem.inputLabels.code3', interaction.guildId),
                languageManager.getString('commands.redeem.inputLabels.message', interaction.guildId)
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
            console.error('Error showing redeem modal:', error);
            const errorMessage = await languageManager.getString(
                'commands.redeem.error',
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
                'commands.redeem.embedTitle',
                interaction.guildId,
                { game: gameNames[game] }
            );

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(embedTitle)
                .setDescription(await (async () => {
                    const descriptions = [];
                    for (const code of codes) {
                        const redeemButton = await languageManager.getString('commands.redeem.redeemButton', interaction.guildId);
                        descriptions.push(`**${code}**\n[${redeemButton}](${redeemUrls[game]}?code=${code})`);
                    }
                    return descriptions.join('\n\n');
                })());

            if (message) {
                const messageLabel = await languageManager.getString('commands.redeem.messageLabel', interaction.guildId);
                embed.addFields({ name: messageLabel, value: message });
            }

            // Send message with role mention
            const roleId = config[roleMappings[game]];
            const roleTag = roleId ? `<@&${roleId}> ` : '';
            await channel.send({ content: roleTag, embeds: [embed] });

            // Send success message
            const successMessage = await languageManager.getString(
                'commands.redeem.success',
                interaction.guildId
            );
            await interaction.reply({ content: successMessage, ephemeral: true });

        } catch (error) {
            console.error('Error processing redeem:', error);
            const errorMessage = await languageManager.getString(
                'commands.redeem.error',
                interaction.guildId
            );
            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    }
};
