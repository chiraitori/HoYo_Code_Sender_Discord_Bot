const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const Config = require('../models/Config');
const Settings = require('../models/Settings');
const languageManager = require('../utils/language');
const { hasAdminPermission } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupthread')
        .setDescription('Setup forum threads for each game to post codes')
        .addChannelOption(option =>
            option.setName('genshin_thread')
                .setDescription('Forum thread for Genshin Impact codes')
                .setRequired(true)
                .addChannelTypes(ChannelType.PublicThread, ChannelType.PrivateThread))
        .addChannelOption(option =>
            option.setName('hsr_thread')
                .setDescription('Forum thread for Honkai: Star Rail codes')
                .setRequired(true)
                .addChannelTypes(ChannelType.PublicThread, ChannelType.PrivateThread))
        .addChannelOption(option =>
            option.setName('zzz_thread')
                .setDescription('Forum thread for Zenless Zone Zero codes')
                .setRequired(true)
                .addChannelTypes(ChannelType.PublicThread, ChannelType.PrivateThread))
        .addRoleOption(option =>
            option.setName('genshin_role')
                .setDescription('Role to mention for Genshin Impact (optional, uses /setup role if not set)')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('hsr_role')
                .setDescription('Role to mention for Honkai: Star Rail (optional, uses /setup role if not set)')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('zzz_role')
                .setDescription('Role to mention for Zenless Zone Zero (optional, uses /setup role if not set)')
                .setRequired(false)),

    async execute(interaction) {
        // Check if command is used in DMs (must be before defer to show proper error)
        if (!interaction.guild) {
            const errorMessage = await languageManager.getString(
                'errors.dmNotAllowed',
                null,
                { command: 'setupthread' }
            ) || '❌ The `/setupthread` command can only be used in Discord servers, not in direct messages.';
            return interaction.reply({ content: errorMessage, flags: 64 });
        }

        // Defer reply IMMEDIATELY to prevent timeout (interactions expire in 3 seconds)
        await interaction.deferReply({ flags: 64 }); // 64 = ephemeral flag

        // Check if user is admin or bot owner
        if (!hasAdminPermission(interaction)) {
            const noPermMessage = await languageManager.getString(
                'commands.setupthread.noPermission',
                interaction.guildId
            ) || 'You need Administrator permission to use this command.';
            return interaction.editReply({ content: noPermMessage });
        }

        try {
            const genshinThread = interaction.options.getChannel('genshin_thread');
            const genshinRole = interaction.options.getRole('genshin_role');
            const hsrThread = interaction.options.getChannel('hsr_thread');
            const hsrRole = interaction.options.getRole('hsr_role');
            const zzzThread = interaction.options.getChannel('zzz_thread');
            const zzzRole = interaction.options.getRole('zzz_role');

            const threads = [
                { thread: genshinThread, name: 'Genshin Impact', role: genshinRole },
                { thread: hsrThread, name: 'Honkai: Star Rail', role: hsrRole },
                { thread: zzzThread, name: 'Zenless Zone Zero', role: zzzRole }
            ];

            // Validate all threads
            for (const { thread, name } of threads) {
                if (![ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.AnnouncementThread].includes(thread.type)) {
                    const errorMsg = await languageManager.getString(
                        'commands.setupthread.error.notThread',
                        interaction.guildId
                    ) || `The selected channel for ${name} is not a thread. Please select a forum thread.`;
                    
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#FF5555')
                        .setTitle('⚠️ Invalid Channel Type')
                        .setDescription(errorMsg)
                        .addFields({
                            name: '💡 Tip',
                            value: 'Make sure you select threads from a forum channel, not regular text channels.'
                        })
                        .setTimestamp();
                    
                    return interaction.editReply({ embeds: [errorEmbed] });
                }
            }

            // Check bot permissions in all threads
            const botMember = await interaction.guild.members.fetch(interaction.client.user.id);
            
            for (const { thread, name } of threads) {
                const permissions = thread.permissionsFor(botMember);
                
                if (!permissions.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
                    const errorMsg = await languageManager.getString(
                        'commands.setupthread.error.noPermission',
                        interaction.guildId
                    ) || `I don't have permission to send messages in the ${name} thread.`;
                    
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#FF5555')
                        .setTitle('⚠️ Missing Permissions')
                        .setDescription(errorMsg)
                        .addFields({
                            name: 'Required Permissions',
                            value: '• View Channel\n• Send Messages\n• Embed Links'
                        })
                        .setFooter({ text: 'Please check bot permissions and try again' })
                        .setTimestamp();
                    
                    return interaction.editReply({ embeds: [errorEmbed] });
                }
            }

            // Save forum threads and roles to config
            const updateData = {
                forumThreads: {
                    genshin: genshinThread.id,
                    hsr: hsrThread.id,
                    zzz: zzzThread.id
                }
            };

            // Only update roles if they were provided
            if (genshinRole) updateData.genshinRole = genshinRole.id;
            if (hsrRole) updateData.hsrRole = hsrRole.id;
            if (zzzRole) updateData.zzzRole = zzzRole.id;

            await Config.findOneAndUpdate(
                { guildId: interaction.guildId },
                updateData,
                { upsert: true, new: true }
            );

            // Enable auto-send by default and enable threads posting
            await Settings.findOneAndUpdate(
                { guildId: interaction.guildId },
                { 
                    autoSendEnabled: true,
                    'autoSendOptions.threads': true
                },
                { upsert: true, new: true }
            );

            // Success message
            const successMsg = await languageManager.getString(
                'commands.setupthread.success',
                interaction.guildId
            ) || `✅ Forum threads configured successfully!`;

            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Forum Threads Setup Complete!')
                .setDescription(successMsg)
                .addFields(
                    {
                        name: '🎮 Genshin Impact',
                        value: `Thread: <#${genshinThread.id}>\nRole: ${genshinRole || '*(uses /setup role)*'}`,
                        inline: true
                    },
                    {
                        name: '🚂 Honkai: Star Rail',
                        value: `Thread: <#${hsrThread.id}>\nRole: ${hsrRole || '*(uses /setup role)*'}`,
                        inline: true
                    },
                    {
                        name: '📺 Zenless Zone Zero',
                        value: `Thread: <#${zzzThread.id}>\nRole: ${zzzRole || '*(uses /setup role)*'}`,
                        inline: true
                    },
                    {
                        name: '🤖 Auto-Send Status',
                        value: '✅ Auto-send is now **ENABLED** and will post codes to these threads automatically',
                        inline: false
                    },
                    {
                        name: '💡 Note',
                        value: 'Roles are optional. If not set here, the bot will use roles from `/setup` command.',
                        inline: false
                    }
                )
                .setFooter({ text: `Server: ${interaction.guild.name}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error in setupthread command:', error);
            
            const errorMsg = await languageManager.getString(
                'commands.setupthread.error.general',
                interaction.guildId
            ) || 'An error occurred while setting up the forum thread.';

            await interaction.editReply({ content: `❌ ${errorMsg}` });
        }
    }
};
