// commands/favgames.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Settings = require('../models/Settings');
const languageManager = require('../utils/language');
const { hasAdminPermission } = require('../utils/permissions');
const { handleDMRestriction } = require('../utils/dmHandler');
const { removeOtherGuildRecords } = require('../utils/guildRecords');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('favgames')
        .setDescription('Set which game codes you want to receive')
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
            if (await handleDMRestriction(interaction, 'favgames')) {
                return;
            }

            if (!hasAdminPermission(interaction)) {
                const noPermMessage = await languageManager.getString(
                    'commands.favgames.noPermission',
                    interaction.guildId
                );
                return interaction.reply({ content: noPermMessage, flags: MessageFlags.Ephemeral });
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const enableFilter = interaction.options.getBoolean('enable_filter');

            const genshin = interaction.options.getBoolean('genshin') ?? true;
            const hsr = interaction.options.getBoolean('hsr') ?? true;
            const zzz = interaction.options.getBoolean('zzz') ?? true;

            const savedSettings = await Settings.findOneAndUpdate(
                { guildId: interaction.guildId },
                {
                    favoriteGames: {
                        enabled: enableFilter,
                        games: {
                            genshin,
                            hkrpg: hsr,
                            nap: zzz
                        }
                    }
                },
                { upsert: true, new: true, sort: { _id: -1 } }
            );
            await removeOtherGuildRecords(Settings, interaction.guildId, savedSettings?._id);

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

            let responseContent = `**${successMessage}**\n\n`;

            const filterStatusText = enableFilter ? enabledText : disabledText;
            const filterStatusMessage = await languageManager.getString(
                'commands.favgames.filterStatus',
                interaction.guildId,
                { status: filterStatusText }
            );
            responseContent += `${filterStatusMessage}\n\n`;

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

            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ content: errorMessage });
                } else {
                    await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
                }
            } catch (responseError) {
                if (responseError?.code !== 40060) {
                    throw responseError;
                }
            }
        }
    }
};
