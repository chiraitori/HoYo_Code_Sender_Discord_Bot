const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Config = require('../models/Config');
const languageManager = require('../utils/language');
const { hasAdminPermission } = require('../utils/permissions');
const { validateChannel } = require('../utils/channelValidator');
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
                    { name: 'View Current', value: 'view' }
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

            let config = await Config.findOne({ guildId: interaction.guildId });

            if (!config) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF5555')
                    .setTitle('⚠️ Setup Required')
                    .setDescription('Please run `/setup` first to configure your server before setting up livestream channels.')
                    .setFooter({ text: `Server: ${interaction.guild.name}` })
                    .setTimestamp();

                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // VIEW action
            if (action === 'view') {
                const currentChannel = config.livestreamChannel
                    ? `<#${config.livestreamChannel}>`
                    : `Using main channel: ${config.channel ? `<#${config.channel}>` : 'Not configured'}`;

                const viewEmbed = new EmbedBuilder()
                    .setColor('#3498db')
                    .setTitle('📺 Livestream Code Channel Configuration')
                    .addFields(
                        { name: 'Current Setting', value: currentChannel },
                        {
                            name: 'Behavior', value: config.livestreamChannel
                                ? '✅ Livestream codes will be sent to the dedicated channel'
                                : 'ℹ️ Livestream codes will be sent to the same channel as regular codes'
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
                    .setTitle('✅ Livestream Channel Removed')
                    .setDescription('Livestream codes will now be sent to the main channel alongside regular codes.')
                    .addFields({
                        name: 'Main Channel',
                        value: config.channel ? `<#${config.channel}>` : 'Not configured'
                    })
                    .setFooter({ text: `Server: ${interaction.guild.name}` })
                    .setTimestamp();

                return interaction.editReply({ embeds: [removeEmbed] });
            }

            // SET action
            if (action === 'set') {
                if (!channel) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#FF5555')
                        .setTitle('❌ Channel Required')
                        .setDescription('Please select a channel when using the "Set Channel" action.')
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
                        .setTitle('⚠️ Insufficient Permissions')
                        .setDescription(`The bot doesn't have the required permissions in ${channel}`)
                        .addFields({
                            name: 'Required Permissions',
                            value: '• View Channel\n• Send Messages\n• Embed Links'
                        })
                        .setFooter({ text: `Server: ${interaction.guild.name}` })
                        .setTimestamp();

                    return interaction.editReply({ embeds: [errorEmbed] });
                }

                const successEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('✅ Livestream Channel Configured')
                    .setDescription('Livestream codes will now be sent to a separate channel!')
                    .addFields(
                        {
                            name: '📺 Livestream Codes',
                            value: `${channel}\n✅ Channel validated successfully!`,
                            inline: true
                        },
                        {
                            name: '📋 Regular Codes',
                            value: config.channel ? `<#${config.channel}>` : 'Not configured',
                            inline: true
                        },
                        {
                            name: '💡 What happens now?',
                            value: '• Regular codes → Main channel\n• Livestream codes (from Special Programs) → Dedicated channel\n• Both channels can have different notification settings!'
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
                .setTitle('❌ Error')
                .setDescription('There was an error configuring the livestream channel.')
                .addFields({ name: 'Error Details', value: `\`\`\`${error.message}\`\`\`` })
                .setFooter({ text: 'Please try again or contact support if the problem persists.' })
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};
