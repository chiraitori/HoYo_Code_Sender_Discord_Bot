const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Config = require('../models/Config');
const Settings = require('../models/Settings');
const languageManager = require('../utils/language');
const { hasAdminPermission } = require('../utils/permissions');
const { handleDMRestriction } = require('../utils/dmHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('livestreamcodesetup')
        .setDescription('Configure separate channel for livestream codes')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Action to perform')
                .addChoices(
                    { name: 'Set Channel', value: 'set' },
                    { name: 'Remove (use main channel)', value: 'remove' },
                    { name: 'View Current', value: 'view' },
                    { name: 'Enable Announcement', value: 'announcement_enable' },
                    { name: 'Disable Announcement', value: 'announcement_disable' }
                )
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel for livestream code notifications (leave empty to use main channel)')
                .setRequired(false)),

    async execute(interaction) {
        // Check if command is used in DMs
        if (await handleDMRestriction(interaction, 'livestreamcodesetup')) {
            return;
        }

        // Check if user is admin or bot owner
        if (!hasAdminPermission(interaction)) {
            const noPermMessage = await languageManager.getString(
                'commands.setup.noPermission',
                interaction.guildId
            );
            return interaction.reply({ content: noPermMessage || 'You need administrator permission to use this command.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const action = interaction.options.getString('action');
            const channel = interaction.options.getChannel('channel');
            const t = (key, replacements = {}) => languageManager.getString(
                `commands.livestreamcodesetup.${key}`,
                interaction.guildId,
                replacements
            );

            let config = await Config.findOne({ guildId: interaction.guildId });
            let settings = await Settings.findOne({ guildId: interaction.guildId });

            if (!config) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF5555')
                    .setTitle(await t('setupRequiredTitle'))
                    .setDescription(await t('setupRequired'))
                    .setFooter({ text: `Server: ${interaction.guild.name}` })
                    .setTimestamp();

                return interaction.editReply({ embeds: [errorEmbed] });
            }

            if (!settings) {
                settings = await Settings.findOneAndUpdate(
                    { guildId: interaction.guildId },
                    { $setOnInsert: { guildId: interaction.guildId } },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
            }

            // VIEW action
            if (action === 'view') {
                const currentChannel = config.livestreamChannel
                    ? `<#${config.livestreamChannel}>`
                    : await t('usingMainChannel', {
                        channel: config.channel ? `<#${config.channel}>` : await t('notConfigured')
                    });
                const announcementsEnabled = settings.livestreamAnnouncementsEnabled !== false;

                const viewEmbed = new EmbedBuilder()
                    .setColor('#3498db')
                    .setTitle(await t('title'))
                    .addFields(
                        { name: await t('currentSetting'), value: currentChannel },
                        {
                            name: await t('behavior'),
                            value: config.livestreamChannel
                                ? await t('dedicatedBehavior')
                                : await t('mainBehavior')
                        },
                        {
                            name: await t('announcementStatus'),
                            value: announcementsEnabled
                                ? await t('announcementEnabled')
                                : await t('announcementDisabled')
                        }
                    )
                    .setFooter({ text: `Server: ${interaction.guild.name}` })
                    .setTimestamp();

                return interaction.editReply({ embeds: [viewEmbed] });
            }

            // REMOVE action
            if (action === 'remove') {
                await Config.findOneAndUpdate(
                    { guildId: interaction.guildId },
                    { $unset: { livestreamChannel: "" } }
                );

                const removeEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle(await t('removedTitle'))
                    .setDescription(await t('removedDescription'))
                    .addFields({
                        name: await t('mainChannel'),
                        value: config.channel ? `<#${config.channel}>` : await t('notConfigured')
                    })
                    .setFooter({ text: `Server: ${interaction.guild.name}` })
                    .setTimestamp();

                return interaction.editReply({ embeds: [removeEmbed] });
            }

            if (action === 'announcement_enable' || action === 'announcement_disable') {
                const enabled = action === 'announcement_enable';
                await Settings.findOneAndUpdate(
                    { guildId: interaction.guildId },
                    {
                        $set: { livestreamAnnouncementsEnabled: enabled },
                        $setOnInsert: { guildId: interaction.guildId }
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );

                const announcementEmbed = new EmbedBuilder()
                    .setColor(enabled ? '#00FF00' : '#FF5555')
                    .setTitle(await t(enabled ? 'announcementEnabledTitle' : 'announcementDisabledTitle'))
                    .setDescription(await t(enabled ? 'announcementEnabledDescription' : 'announcementDisabledDescription'))
                    .setFooter({ text: `Server: ${interaction.guild.name}` })
                    .setTimestamp();

                return interaction.editReply({ embeds: [announcementEmbed] });
            }

            // SET action
            if (action === 'set') {
                if (!channel) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#FF5555')
                        .setTitle(await t('channelRequiredTitle'))
                        .setDescription(await t('channelRequired'))
                        .setFooter({ text: `Server: ${interaction.guild.name}` })
                        .setTimestamp();

                    return interaction.editReply({ embeds: [errorEmbed] });
                }

                // Temporarily save channel to validate
                await Config.findOneAndUpdate(
                    { guildId: interaction.guildId },
                    { livestreamChannel: channel.id }
                );

                // Validate channel permissions
                const channelPerms = channel.permissionsFor(interaction.client.user);
                if (!channelPerms || !channelPerms.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
                    // Revert the change
                    await Config.findOneAndUpdate(
                        { guildId: interaction.guildId },
                        { $unset: { livestreamChannel: "" } }
                    );

                    const errorEmbed = new EmbedBuilder()
                        .setColor('#FF5555')
                        .setTitle(await t('insufficientPermissionsTitle'))
                        .setDescription(await t('insufficientPermissions', { channel }))
                        .addFields({
                            name: await t('requiredPermissions'),
                            value: await t('requiredPermissionsValue')
                        })
                        .setFooter({ text: `Server: ${interaction.guild.name}` })
                        .setTimestamp();

                    return interaction.editReply({ embeds: [errorEmbed] });
                }

                const successEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle(await t('configuredTitle'))
                    .setDescription(await t('configuredDescription'))
                    .addFields(
                        {
                            name: await t('livestreamCodes'),
                            value: `${channel}\n${await languageManager.getString('commands.setup.channelValidation', interaction.guildId)}`,
                            inline: true
                        },
                        {
                            name: await t('regularCodes'),
                            value: config.channel ? `<#${config.channel}>` : await t('notConfigured'),
                            inline: true
                        },
                        {
                            name: await t('whatHappensNow'),
                            value: await t('whatHappensNowValue')
                        }
                    )
                    .setFooter({ text: `Server: ${interaction.guild.name}` })
                    .setTimestamp();

                return interaction.editReply({ embeds: [successEmbed] });
            }

        } catch (error) {
            console.error('Livestream setup error:', error);

            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle(await languageManager.getString('commands.livestreamcodesetup.errorTitle', interaction.guildId))
                .setDescription(await languageManager.getString('commands.livestreamcodesetup.errorDescription', interaction.guildId))
                .addFields({ name: 'Error Details', value: `\`\`\`${error.message}\`\`\`` })
                .setFooter({ text: await languageManager.getString('commands.livestreamcodesetup.errorFooter', interaction.guildId) })
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};
