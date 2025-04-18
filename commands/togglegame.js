const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Settings = require('../models/Settings');
const Config = require('../models/Config');
const languageManager = require('../utils/language');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('togglegame')
        .setDescription('Enable/disable notifications for specific games')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('game')
                .setDescription('Select game')
                .setRequired(true)
                .addChoices(
                    { name: 'Genshin Impact', value: 'genshin' },
                    { name: 'Honkai: Star Rail', value: 'hkrpg' },
                    { name: 'Zenless Zone Zero', value: 'nap' }
                ))
        .addBooleanOption(option =>
            option.setName('enabled')
                .setDescription('Enable or disable notifications')
                .setRequired(true))
        .addRoleOption(option => 
            option.setName('mention_role')
                .setDescription('Role to mention (optional)')
                .setRequired(false)),

    async execute(interaction) {
        // Check permissions
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
            const noPermMessage = await languageManager.getString(
                'commands.togglegame.noPermission',
                interaction.guildId
            );
            return interaction.reply({ content: noPermMessage, ephemeral: true });
        }

        // Get loading message
        const loadingMessage = await languageManager.getString(
            'commands.togglegame.loading',
            interaction.guildId
        );
        await interaction.deferReply({ ephemeral: true });

        try {
            const game = interaction.options.getString('game');
            const enabled = interaction.options.getBoolean('enabled');
            const role = interaction.options.getRole('mention_role');
            
            // Game name mapping for display
            const gameNames = {
                'genshin': 'Genshin Impact',
                'hkrpg': 'Honkai: Star Rail',
                'nap': 'Zenless Zone Zero'
            };
            
            // Role field mapping
            const roleFields = {
                'genshin': 'genshinRole',
                'hkrpg': 'hsrRole',
                'nap': 'zzzRole'
            };

            // Settings field mapping
            const settingsFields = {
                'genshin': 'genshin',
                'hkrpg': 'hkrpg',
                'nap': 'nap'
            };
            
            // Update role in config if provided
            if (role) {
                await Config.findOneAndUpdate(
                    { guildId: interaction.guildId },
                    { [roleFields[game]]: role.id },
                    { upsert: true }
                );
            }
            
            // Update settings in database
            let settings = await Settings.findOne({ guildId: interaction.guildId });
            
            if (!settings) {
                // Create new settings if none exist
                settings = new Settings({
                    guildId: interaction.guildId,
                    autoSendEnabled: true,
                    gameNotifications: {
                        genshin: false,
                        hkrpg: false,
                        nap: false
                    }
                });
            }
            
            // Make sure gameNotifications exists
            if (!settings.gameNotifications) {
                settings.gameNotifications = {
                    genshin: false,
                    hkrpg: false,
                    nap: false
                };
            }
            
            // Update the specific game notification setting
            settings.gameNotifications[settingsFields[game]] = enabled;
            await settings.save();
            
            // Get config to check if a role is set
            const config = await Config.findOne({ guildId: interaction.guildId });
            const hasRole = config && config[roleFields[game]];
            
            // Get game name in user's language
            const gameNameKey = `games.${game}`;
            const gameName = await languageManager.getString(gameNameKey, interaction.guildId) || gameNames[game];
            
            let responseMessage;
            
            if (enabled) {
                if (role) {
                    responseMessage = await languageManager.getString(
                        'commands.togglegame.enabledWithNewRole',
                        interaction.guildId,
                        { game: gameName, role: role.toString() }
                    );
                } else if (hasRole) {
                    const roleId = config[roleFields[game]];
                    responseMessage = await languageManager.getString(
                        'commands.togglegame.enabledWithExistingRole',
                        interaction.guildId,
                        { game: gameName, role: `<@&${roleId}>` }
                    );
                } else {
                    responseMessage = await languageManager.getString(
                        'commands.togglegame.enabledNoRole',
                        interaction.guildId,
                        { game: gameName, command: `/togglegame ${game} true @role` }
                    );
                }
            } else {
                responseMessage = await languageManager.getString(
                    'commands.togglegame.disabled',
                    interaction.guildId,
                    { game: gameName }
                );
            }
            
            await interaction.editReply({ content: responseMessage });
        } catch (error) {
            console.error('Error toggling game notification:', error);
            
            const errorMessage = await languageManager.getString(
                'commands.togglegame.error',
                interaction.guildId
            );
            
            await interaction.editReply({ content: errorMessage });
        }
    }
};