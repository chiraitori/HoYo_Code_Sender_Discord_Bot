const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Config = require('../models/Config');
const Settings = require('../models/Settings');
const languageManager = require('../utils/language');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup roles and channel for code notifications')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(option => 
            option.setName('genshin_role')
                .setDescription('Role for Genshin Impact notifications')
                .setRequired(true))
        .addRoleOption(option => 
            option.setName('hsr_role')
                .setDescription('Role for Honkai: Star Rail notifications')
                .setRequired(true))
        .addRoleOption(option => 
            option.setName('zzz_role')
                .setDescription('Role for Zenless Zone Zero notifications')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel for code notifications')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('auto_send')
                .setDescription('Enable automatic code sending')
                .setRequired(true)),

    async execute(interaction) {
        // Add strict permission check
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
            const noPermMessage = await languageManager.getString(
                'commands.setup.noPermission',
                interaction.guildId
            );
            return interaction.reply({ content: noPermMessage, ephemeral: true });
        }
        
        await interaction.deferReply({ ephemeral: true });

        try {
            const genshinRole = interaction.options.getRole('genshin_role');
            const hsrRole = interaction.options.getRole('hsr_role');
            const zzzRole = interaction.options.getRole('zzz_role');
            const channel = interaction.options.getChannel('channel');
            
            // Get auto_send option directly as boolean
            const enableAutoSend = interaction.options.getBoolean('auto_send');

            // Validate bot permissions in channel
            const botPermissions = channel.permissionsFor(interaction.client.user);
            if (!botPermissions.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
                const errorMsg = await languageManager.getString(
                    'commands.setup.error.permissions',
                    interaction.guildId
                );
                return interaction.editReply({ content: errorMsg });
            }

            // Update config in database
            await Config.findOneAndUpdate(
                { guildId: interaction.guildId },
                {
                    genshinRole: genshinRole.id,
                    hsrRole: hsrRole.id,
                    zzzRole: zzzRole.id,
                    channel: channel.id
                },
                { upsert: true, new: true }
            );
            
            // Enable or disable auto-send in settings based on the option
            await Settings.findOneAndUpdate(
                { guildId: interaction.guildId },
                { autoSendEnabled: enableAutoSend },
                { upsert: true, new: true }
            );

            // Get success message
            const successMessage = await languageManager.getString(
                'commands.setup.success',
                interaction.guildId
            );

            // Format role messages
            const roles = [
                { role: genshinRole, type: 'Genshin Impact' },
                { role: hsrRole, type: 'Honkai: Star Rail' },
                { role: zzzRole, type: 'Zenless Zone Zero' }
            ];

            const roleMessages = await Promise.all(roles.map(async ({ role, type }) => {
                const msg = await languageManager.getString(
                    'commands.setup.roleSetup',
                    interaction.guildId,
                    { role: role.toString(), type: type }
                );
                return `• ${msg}`;
            }));

            // Get channel setup message
            const channelMessage = await languageManager.getString(
                'commands.setup.channelSetup',
                interaction.guildId,
                { channel: channel.toString() }
            );
            
            // Get auto-send status message
            const autoSendStatus = enableAutoSend ? 'ENABLED' : 'DISABLED';
            const autoSendMessage = await languageManager.getString(
                'commands.setup.autoSendSetup',
                interaction.guildId,
                { status: autoSendStatus }
            ) || `Auto-send feature: ${autoSendStatus}`;

            // Combine all messages with proper formatting
            const fullMessage = [
                `**${successMessage}**`,
                '',
                ...roleMessages,
                '',
                `• ${channelMessage}`,
                `• ${autoSendMessage}`
            ].join('\n');

            await interaction.editReply({ content: fullMessage });

        } catch (error) {
            console.error('Setup error:', error);
            const errorMessage = await languageManager.getString(
                'commands.setup.error',
                interaction.guildId
            );
            await interaction.editReply({ content: errorMessage });
        }
    }
};