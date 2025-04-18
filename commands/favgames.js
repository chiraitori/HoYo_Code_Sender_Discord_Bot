// commands/favgames.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Settings = require('../models/Settings');
const languageManager = require('../utils/language');
const { hasAdminPermission } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('favgames')
        .setDescription('Set which game codes you want to receive')
        // Remove the default permissions restriction to make command visible to everyone
        // Admin permissions will be enforced in the execute function
        .addBooleanOption(option =>
            option.setName('enable_filter')
                .setDescription('Enable game filtering')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('genshin')
                .setDescription('Receive Genshin Impact codes')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('hsr')
                .setDescription('Receive Honkai: Star Rail codes')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('zzz')
                .setDescription('Receive Zenless Zone Zero codes')
                .setRequired(false)),

    async execute(interaction) {
        try {
            // Check if user is admin or bot owner using our utility
            if (!hasAdminPermission(interaction)) {
                const noPermMessage = await languageManager.getString(
                    'commands.favgames.noPermission',
                    interaction.guildId
                );
                return interaction.reply({ content: noPermMessage, ephemeral: true });
            }

            // Get loading message
            const loadingMessage = await languageManager.getString(
                'commands.favgames.loading',
                interaction.guildId
            );
            
            await interaction.deferReply({ ephemeral: true });

            const enableFilter = interaction.options.getBoolean('enable_filter');
            
            // Get game options (default to true if not specified when filter is enabled)
            const genshin = interaction.options.getBoolean('genshin') ?? true;
            const hsr = interaction.options.getBoolean('hsr') ?? true;
            const zzz = interaction.options.getBoolean('zzz') ?? true;
            
            // Get settings or create if not exists
            let settings = await Settings.findOne({ guildId: interaction.guildId });
            if (!settings) {
                settings = new Settings({ guildId: interaction.guildId });
            }

            // Update settings with favorite games
            settings.favoriteGames = {
                enabled: enableFilter,
                games: {
                    genshin: genshin,
                    hkrpg: hsr, 
                    nap: zzz
                }
            };
            
            await settings.save();

            // Get success message and status strings
            const successMessage = await languageManager.getString(
                'commands.favgames.success',
                interaction.guildId
            );
            
            const enabledText = await languageManager.getString(
                'common.enabled',
                interaction.guildId
            ) || 'ENABLED';
            
            const disabledText = await languageManager.getString(
                'common.disabled',
                interaction.guildId
            ) || 'DISABLED';
            
            // Get game names
            const genshinName = await languageManager.getString(
                'games.genshin',
                interaction.guildId
            ) || 'Genshin Impact';
            
            const hsrName = await languageManager.getString(
                'games.hkrpg',
                interaction.guildId
            ) || 'Honkai: Star Rail';
            
            const zzzName = await languageManager.getString(
                'games.nap',
                interaction.guildId
            ) || 'Zenless Zone Zero';

            // Format response message
            let responseContent = `**${successMessage}**\n\n`;
            
            // Show filtering status
            const filterStatusText = enableFilter ? enabledText : disabledText;
            const filterStatusMessage = await languageManager.getString(
                'commands.favgames.filterStatus',
                interaction.guildId,
                { status: filterStatusText }
            );
            responseContent += `${filterStatusMessage}\n\n`;
            
            // If filtering is enabled, show individual game statuses
            if (enableFilter) {
                const gameStatusHeader = await languageManager.getString(
                    'commands.favgames.gameStatusHeader',
                    interaction.guildId
                );
                responseContent += `**${gameStatusHeader}**\n`;
                
                const genshinStatus = genshin ? enabledText : disabledText;
                const hsrStatus = hsr ? enabledText : disabledText;
                const zzzStatus = zzz ? enabledText : disabledText;
                
                responseContent += `• ${genshinName}: ${genshinStatus}\n`;
                responseContent += `• ${hsrName}: ${hsrStatus}\n`;
                responseContent += `• ${zzzName}: ${zzzStatus}\n`;
            } else {
                const allGamesMessage = await languageManager.getString(
                    'commands.favgames.allGamesEnabled',
                    interaction.guildId
                );
                responseContent += `*${allGamesMessage}*`;
            }

            await interaction.editReply({
                content: responseContent
            });

        } catch (error) {
            console.error('Error setting favorite games:', error);
            
            const errorMessage = await languageManager.getString(
                'commands.favgames.error',
                interaction.guildId
            ) || 'An error occurred while setting favorite games.';

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
};