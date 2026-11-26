const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    MessageFlags
} = require('discord.js');
const Config = require('../models/Config');
const languageManager = require('../utils/language');
const { hasAdminPermission } = require('../utils/permissions');
const { handleDMRestriction } = require('../utils/dmHandler');
const { getRoleMention } = require('../utils/roleMention');

const gameAliases = {
    genshin: 'genshin',
    hsr: 'hsr',
    hkrpg: 'hsr',
    zzz: 'zzz',
    nap: 'zzz'
};

const gameNames = {
    genshin: 'Genshin Impact',
    hsr: 'Honkai: Star Rail',
    zzz: 'Zenless Zone Zero'
};

const gameEmojis = {
    genshin: '<:genshin:1368073403231375430>',
    hsr: '<:hsr:1368073099756703794>',
    zzz: '<:zzz:1368073452174704763>'
};

const postcodeUrls = {
    genshin: 'https://genshin.hoyoverse.com/en/gift',
    hsr: 'https://hsr.hoyoverse.com/gift',
    zzz: 'https://zenless.hoyoverse.com/redemption'
};

const roleMappings = {
    genshin: 'genshinRole',
    hsr: 'hsrRole',
    zzz: 'zzzRole'
};

async function safeEphemeralReply(interaction, payload) {
    if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: payload.content, embeds: payload.embeds });
    } else {
        await interaction.reply({ ...payload, flags: MessageFlags.Ephemeral });
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('postcode')
        .setDescription('Post redemption codes manually to your server notification channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Check if command is used in DMs
            if (await handleDMRestriction(interaction, 'postcode')) {
                return;
            }

            // Check if user is admin or bot owner
            if (!hasAdminPermission(interaction)) {
                const noPermMessage = await languageManager.getString(
                    'commands.postcode.noPermission',
                    interaction.guildId
                );
                return interaction.reply({ content: noPermMessage, flags: MessageFlags.Ephemeral });
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
            await safeEphemeralReply(interaction, { content: errorMessage });
        }
    },

    async modalSubmit(interaction) {
        try {
            if (!interaction.guild) {
                const dmError = await languageManager.getString(
                    'errors.dmNotAllowed',
                    null,
                    { command: 'postcode' }
                );
                return interaction.reply({ content: dmError, flags: MessageFlags.Ephemeral });
            }

            if (!hasAdminPermission(interaction)) {
                const noPermMessage = await languageManager.getString(
                    'commands.postcode.noPermission',
                    interaction.guildId
                );
                return interaction.reply({ content: noPermMessage, flags: MessageFlags.Ephemeral });
            }

            const rawGame = interaction.fields.getTextInputValue('game').toLowerCase().trim();
            const game = gameAliases[rawGame];
            const code1 = interaction.fields.getTextInputValue('code1').trim().toUpperCase();
            const code2 = interaction.fields.getTextInputValue('code2').trim().toUpperCase();
            const code3 = interaction.fields.getTextInputValue('code3').trim().toUpperCase();
            const message = interaction.fields.getTextInputValue('message').trim();

            // Validate game input
            if (!game) {
                const invalidGameMessage = await languageManager.getString(
                    'commands.postcode.invalidGame',
                    interaction.guildId
                ) || 'Invalid game. Please use: genshin, hsr, or zzz';
                return interaction.reply({ content: invalidGameMessage, flags: MessageFlags.Ephemeral });
            }

            // Validate at least one code is provided
            if (!code1) {
                const noCodeMessage = await languageManager.getString(
                    'commands.postcode.noCode',
                    interaction.guildId
                ) || 'At least one code is required.';
                return interaction.reply({ content: noCodeMessage, flags: MessageFlags.Ephemeral });
            }

            const codes = [...new Set([code1, code2, code3].filter(Boolean))];

            // Get config from database
            const config = await Config.findOne({ guildId: interaction.guild.id }).sort({ _id: -1 });
            if (!config || !config.channel) {
                const noConfigMessage = await languageManager.getString(
                    'errors.noConfig',
                    interaction.guildId
                );
                return interaction.reply({ content: noConfigMessage, flags: MessageFlags.Ephemeral });
            }

            const channel = interaction.guild.channels.cache.get(config.channel)
                || await interaction.guild.channels.fetch(config.channel).catch(() => null);
            if (!channel || typeof channel.send !== 'function') {
                const invalidChannelMessage = await languageManager.getString(
                    'errors.invalidChannel',
                    interaction.guildId
                );
                return interaction.reply({ content: invalidChannelMessage, flags: MessageFlags.Ephemeral });
            }

            const botMember = interaction.guild.members.me
                || await interaction.guild.members.fetchMe().catch(() => null);
            const sendPerm = channel.isThread?.()
                ? PermissionFlagsBits.SendMessagesInThreads
                : PermissionFlagsBits.SendMessages;
            const permissions = botMember ? channel.permissionsFor?.(botMember) : null;
            if (permissions && !permissions.has([
                PermissionFlagsBits.ViewChannel,
                sendPerm,
                PermissionFlagsBits.EmbedLinks
            ])) {
                const invalidChannelMessage = await languageManager.getString(
                    'errors.invalidChannel',
                    interaction.guildId
                );
                return interaction.reply({ content: invalidChannelMessage, flags: MessageFlags.Ephemeral });
            }

            // Create embed with translated content
            const baseEmbedTitle = await languageManager.getString(
                'commands.postcode.embedTitle',
                interaction.guildId,
                { game: gameNames[game] }
            );
            const embedTitle = `${gameEmojis[game]} ${baseEmbedTitle}`;
            const postcodeButton = await languageManager.getString(
                'commands.postcode.postcodeButton',
                interaction.guildId
            );

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(embedTitle)
                .setDescription(
                    codes
                        .map(code => `**${code}**\n[${postcodeButton}](${postcodeUrls[game]}?code=${encodeURIComponent(code)})`)
                        .join('\n\n')
                )
                .setTimestamp();

            if (message) {
                const messageLabel = await languageManager.getString('commands.postcode.messageLabel', interaction.guildId);
                embed.addFields({ name: messageLabel, value: message });
            }

            // Send message with safe role mention
            const roleId = config[roleMappings[game]];
            const roleMention = getRoleMention(roleId);
            await channel.send({
                content: roleMention.content,
                embeds: [embed],
                allowedMentions: roleMention.allowedMentions
            });

            // Send success message
            const successMessage = await languageManager.getString(
                'commands.postcode.success',
                interaction.guildId
            );
            await interaction.reply({ content: successMessage, flags: MessageFlags.Ephemeral });

        } catch (error) {
            console.error('Error processing postcode:', error);
            const errorMessage = await languageManager.getString(
                'commands.postcode.error',
                interaction.guildId
            );
            await safeEphemeralReply(interaction, { content: errorMessage });
        }
    }
};
