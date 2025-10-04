const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Config = require('../models/Config');
const Settings = require('../models/Settings');
const languageManager = require('../utils/language');
const { hasAdminPermission } = require('../utils/permissions');
const { validateChannel } = require('../utils/channelValidator');
const { handleDMRestriction } = require('../utils/dmHandler');

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
                .setRequired(true)),

    async execute(interaction) {
        // Check if command is used in DMs
        if (await handleDMRestriction(interaction, 'setup')) {
            return;
        }

        // Check if user is admin or bot owner
        if (!hasAdminPermission(interaction)) {
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

            // Custom channel validation using our new validateChannel function
            // First, save channel ID temporarily to check with validateChannel
            const tempConfig = await Config.findOneAndUpdate(
                { guildId: interaction.guildId },
                { channel: channel.id },
                { upsert: true, new: true }
            );

            // Validate channel using our utility function
            const validationResult = await validateChannel(interaction.client, interaction.guildId);
            
            if (!validationResult.isValid) {
                // If channel validation fails, provide a detailed error message in an embed
                const channelErrorMsg = await languageManager.getString(
                    'commands.setup.error.channelValidation',
                    interaction.guildId
                ) || 'Channel validation failed';
                
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF5555')
                    .setTitle('⚠️ ' + channelErrorMsg)
                    .setDescription(`**${validationResult.error}**\n\nPlease choose a different channel where the bot has proper permissions.`)
                    .addFields({ 
                        name: 'Required Permissions', 
                        value: '• View Channel\n• Send Messages\n• Embed Links\n• Attach Files\n• Use External Emojis' 
                    })
                    .setFooter({ text: `Server: ${interaction.guild.name}` })
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }
            
            // If validation passed, update the full configuration
            await Config.findOneAndUpdate(
                { guildId: interaction.guildId },
                {
                    genshinRole: genshinRole.id,
                    hsrRole: hsrRole.id,
                    zzzRole: zzzRole.id,
                    channel: channel.id,
                    // Reset notification flags since setup is successful
                    'notifications.channelMissing.notified': false,
                    'notifications.channelMissing.lastNotified': null,
                    'notifications.permissionMissing.notified': false,
                    'notifications.permissionMissing.lastNotified': null,
                    'notifications.permissionMissing.permission': null
                },
                { upsert: true, new: true }
            );
            
            // Enable or disable auto-send in settings based on the option
            await Settings.findOneAndUpdate(
                { guildId: interaction.guildId },
                { 
                    autoSendEnabled: enableAutoSend,
                    // Reset channelStatus as we've just validated it
                    'channelStatus.isInvalid': false,
                    'channelStatus.lastError': null,
                    'channelStatus.lastChecked': new Date()
                },
                { upsert: true, new: true }
            );

            // Get translated strings for the success message
            const successMessage = await languageManager.getString(
                'commands.setup.success',
                interaction.guildId
            ) || "Server configuration completed successfully!";
            
            // Get translated game names
            const genshin = await languageManager.getString('games.genshin', interaction.guildId) || "Genshin Impact";
            const hsr = await languageManager.getString('games.hkrpg', interaction.guildId) || "Honkai: Star Rail";
            const zzz = await languageManager.getString('games.nap', interaction.guildId) || "Zenless Zone Zero";
            
            // Get translated UI elements
            const readyMessage = await languageManager.getString('commands.setup.readyMessage', interaction.guildId) || 
                "Your server is now ready to receive code notifications!";
            const rolesHeader = await languageManager.getString('commands.setup.rolesHeader', interaction.guildId) || 
                "🎭 Notification Roles";
            const channelHeader = await languageManager.getString('commands.setup.channelHeader', interaction.guildId) || 
                "📣 Notification Channel";
            const autoSendHeader = await languageManager.getString('commands.setup.autoSendHeader', interaction.guildId) || 
                "⚙️ Auto-send Feature";
            
            // Create a success embed
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ ' + successMessage)
                .setDescription(readyMessage)
                .setTimestamp()
                .setFooter({ text: `Server: ${interaction.guild.name}` });
                
            // Format role information for embed fields
            const roles = [
                { role: genshinRole, type: genshin, emoji: '<:genshin:1368073403231375430> ' },
                { role: hsrRole, type: hsr, emoji: '<:hsr:1368073099756703794> ' },
                { role: zzzRole, type: zzz, emoji: '<:zzz:1368073452174704763> ' }
            ];

            // Add roles field
            const roleLines = roles.map(({ role, type, emoji }) => `${emoji}${type}: ${role}`).join('\n');
            successEmbed.addFields({ name: rolesHeader, value: roleLines });
            
            // Add channel field with validation success
            const channelValidMsg = await languageManager.getString(
                'commands.setup.channelValidation',
                interaction.guildId
            ) || "✅ Channel validated successfully! Bot can send messages here.";
            
            successEmbed.addFields({ 
                name: channelHeader, 
                value: `${channel}\n${channelValidMsg}` 
            });
            
            // Add auto-send status field
            const autoSendStatus = enableAutoSend ? 
                await languageManager.getString('common.enabled', interaction.guildId) || 'ENABLED' : 
                await languageManager.getString('common.disabled', interaction.guildId) || 'DISABLED';
            successEmbed.addFields({ 
                name: autoSendHeader, 
                value: autoSendStatus
            });
            
            // Add tip to test the setup with demoautosend command
            const demoTipHeader = await languageManager.getString(
                'commands.setup.demoTipHeader',
                interaction.guildId
            ) || '💡 Testing Tip';
            
            const demoTipText = await languageManager.getString(
                'commands.setup.demoTipText',
                interaction.guildId
            ) || 'You can test your setup right away by using the `/demoautosend` command to send demo notification messages.';
            
            successEmbed.addFields({
                name: demoTipHeader,
                value: demoTipText
            });

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Setup error:', error);
            const errorMessage = await languageManager.getString(
                'commands.setup.error',
                interaction.guildId
            );
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ ' + errorMessage)
                .setDescription('There was an error setting up the bot configuration.')
                .addFields({ name: 'Error Details', value: `\`\`\`${error.message}\`\`\`` })
                .setFooter({ text: 'Please try again or contact support if the problem persists.' })
                .setTimestamp();
                
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};