const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Config = require('../models/Config');
const Settings = require('../models/Settings');
const languageManager = require('../utils/language');
const { hasAdminPermission } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup roles and channel for code notifications')
        // Remove the default permissions restriction to make command visible to everyone
        // Admin permissions will be enforced in the execute function
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
                .setRequired(true))
        // Then all OPTIONAL options
        .addRoleOption(option => 
            option.setName('genshin_role')
                .setDescription('Role for Genshin Impact notifications')
                .setRequired(false))
        .addRoleOption(option => 
            option.setName('hsr_role')
                .setDescription('Role for Honkai: Star Rail notifications')
                .setRequired(false))
        .addRoleOption(option => 
            option.setName('zzz_role')
                .setDescription('Role for Zenless Zone Zero notifications')
                .setRequired(false)),

    async execute(interaction) {
        // Check if user is admin or bot owner
        if (!hasAdminPermission(interaction)) {
            const noPermMessage = await languageManager.getString(
                'commands.setup.noPermission',
                interaction.guildId
            );
            return interaction.reply({ content: noPermMessage, ephemeral: true });
        }
        
        // Get loading message
        const loadingMessage = await languageManager.getString(
            'commands.setup.loading',
            interaction.guildId
        );
        await interaction.deferReply({ ephemeral: true });

        try {
            const genshinRole = interaction.options.getRole('genshin_role');
            const hsrRole = interaction.options.getRole('hsr_role');
            const zzzRole = interaction.options.getRole('zzz_role');
            const channel = interaction.options.getChannel('channel');
            
            // Get auto_send option directly as boolean
            const enableAutoSend = interaction.options.getBoolean('auto_send');

            // Determine which games should receive notifications based on role selection
            const notifyGenshin = genshinRole !== null;
            const notifyHSR = hsrRole !== null;
            const notifyZZZ = zzzRole !== null;

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
                    genshinRole: genshinRole?.id || null,
                    hsrRole: hsrRole?.id || null,
                    zzzRole: zzzRole?.id || null,
                    channel: channel.id
                },
                { upsert: true, new: true }
            );
            
            // Update settings with auto-send and game notification preferences
            await Settings.findOneAndUpdate(
                { guildId: interaction.guildId },
                { 
                    autoSendEnabled: enableAutoSend,
                    gameNotifications: {
                        genshin: notifyGenshin,
                        hkrpg: notifyHSR,
                        nap: notifyZZZ
                    }
                },
                { upsert: true, new: true }
            );

            // Get success message
            const successMessage = await languageManager.getString(
                'commands.setup.success',
                interaction.guildId
            );

            // Format role messages for roles that were provided
            const roleMessages = [];
            
            if (genshinRole) {
                const genshinName = await languageManager.getString('games.genshin', interaction.guildId) || 'Genshin Impact';
                const msg = await languageManager.getString(
                    'commands.setup.roleSetup',
                    interaction.guildId,
                    { role: genshinRole.toString(), type: genshinName }
                );
                roleMessages.push(`• ${msg}`);
            }
            
            if (hsrRole) {
                const hsrName = await languageManager.getString('games.hkrpg', interaction.guildId) || 'Honkai: Star Rail';
                const msg = await languageManager.getString(
                    'commands.setup.roleSetup',
                    interaction.guildId,
                    { role: hsrRole.toString(), type: hsrName }
                );
                roleMessages.push(`• ${msg}`);
            }
            
            if (zzzRole) {
                const zzzName = await languageManager.getString('games.nap', interaction.guildId) || 'Zenless Zone Zero';
                const msg = await languageManager.getString(
                    'commands.setup.roleSetup',
                    interaction.guildId,
                    { role: zzzRole.toString(), type: zzzName }
                );
                roleMessages.push(`• ${msg}`);
            }

            // Get channel setup message
            const channelMessage = await languageManager.getString(
                'commands.setup.channelSetup',
                interaction.guildId,
                { channel: channel.toString() }
            );
            
            // Get auto-send status message
            const autoSendStatus = enableAutoSend ? 
                await languageManager.getString('common.enabled', interaction.guildId) || 'ENABLED' : 
                await languageManager.getString('common.disabled', interaction.guildId) || 'DISABLED';
                
            const autoSendMessage = await languageManager.getString(
                'commands.setup.autoSendSetup',
                interaction.guildId,
                { status: autoSendStatus }
            );

            // Add notification status
            const notificationMessages = [];
            
            // Game notification status strings
            const genshinName = await languageManager.getString('games.genshin', interaction.guildId) || 'Genshin Impact';
            const hsrName = await languageManager.getString('games.hkrpg', interaction.guildId) || 'Honkai: Star Rail';
            const zzzName = await languageManager.getString('games.nap', interaction.guildId) || 'Zenless Zone Zero';
            
            const enabledText = await languageManager.getString('common.enabled', interaction.guildId) || 'ENABLED';
            const disabledText = await languageManager.getString('common.disabled', interaction.guildId) || 'DISABLED';
            const noRoleText = await languageManager.getString('commands.setup.noRole', interaction.guildId) || '(no role set)';
            
            if (notifyGenshin) {
                const notifyMsg = await languageManager.getString(
                    'commands.setup.notificationsEnabled',
                    interaction.guildId,
                    { game: genshinName }
                );
                notificationMessages.push(`• ${notifyMsg}`);
            } else {
                const notifyMsg = await languageManager.getString(
                    'commands.setup.notificationsDisabled',
                    interaction.guildId,
                    { game: genshinName, reason: noRoleText }
                );
                notificationMessages.push(`• ${notifyMsg}`);
            }
            
            if (notifyHSR) {
                const notifyMsg = await languageManager.getString(
                    'commands.setup.notificationsEnabled',
                    interaction.guildId,
                    { game: hsrName }
                );
                notificationMessages.push(`• ${notifyMsg}`);
            } else {
                const notifyMsg = await languageManager.getString(
                    'commands.setup.notificationsDisabled',
                    interaction.guildId,
                    { game: hsrName, reason: noRoleText }
                );
                notificationMessages.push(`• ${notifyMsg}`);
            }
            
            if (notifyZZZ) {
                const notifyMsg = await languageManager.getString(
                    'commands.setup.notificationsEnabled',
                    interaction.guildId,
                    { game: zzzName }
                );
                notificationMessages.push(`• ${notifyMsg}`);
            } else {
                const notifyMsg = await languageManager.getString(
                    'commands.setup.notificationsDisabled',
                    interaction.guildId,
                    { game: zzzName, reason: noRoleText }
                );
                notificationMessages.push(`• ${notifyMsg}`);
            }

            // Get header strings
            const rolesHeader = await languageManager.getString('commands.setup.rolesHeader', interaction.guildId) || 'Roles Set:';
            const noRolesWarning = await languageManager.getString('commands.setup.noRolesWarning', interaction.guildId) || 'No roles set. You won\'t receive notifications for any games.';
            const gameNotificationsHeader = await languageManager.getString('commands.setup.gameNotificationsHeader', interaction.guildId) || 'Game Notifications:';

            // Combine all messages with proper formatting
            const messageParts = [
                `**${successMessage}**`,
                ''
            ];
            
            if (roleMessages.length > 0) {
                messageParts.push(`**${rolesHeader}**`, ...roleMessages, '');
            } else {
                messageParts.push(`**${noRolesWarning}**`, '');
            }
            
            messageParts.push(
                `• ${channelMessage}`,
                `• ${autoSendMessage}`,
                '',
                `**${gameNotificationsHeader}**`,
                ...notificationMessages
            );

            await interaction.editReply({ content: messageParts.join('\n') });

        } catch (error) {
            console.error('Setup error:', error);
            const errorMessage = await languageManager.getString(
                'commands.setup.error.general',
                interaction.guildId
            );
            await interaction.editReply({ content: errorMessage });
        }
    }
};