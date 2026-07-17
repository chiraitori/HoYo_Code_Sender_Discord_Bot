const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Settings = require('../models/Settings');
const languageManager = require('../utils/language');
const { hasAdminPermission } = require('../utils/permissions');
const { handleDMRestriction } = require('../utils/dmHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autosendoptions')
        .setDescription('Configure where auto-send posts codes (channel, threads, or both)')
        .addStringOption(option =>
            option.setName('channel')
                .setDescription('Enable/disable auto-send to main channel')
                .setRequired(true)
                .addChoices(
                    { name: 'Enabled', value: 'enabled' },
                    { name: 'Disabled', value: 'disabled' }
                ))
        .addStringOption(option =>
            option.setName('threads')
                .setDescription('Enable/disable auto-send to forum threads')
                .setRequired(true)
                .addChoices(
                    { name: 'Enabled', value: 'enabled' },
                    { name: 'Disabled', value: 'disabled' }
                )),

    async execute(interaction) {
        // Check if command is used in DMs
        if (!interaction.guild) {
            const errorMessage = await languageManager.getString(
                'errors.dmNotAllowed',
                null,
                { command: 'autosendoptions' }
            ) || '❌ The `/autosendoptions` command can only be used in Discord servers, not in direct messages.';
            return interaction.reply({ content: errorMessage, flags: 64 });
        }

        // Defer reply immediately
        await interaction.deferReply({ flags: 64 });

        // Check if user is admin or bot owner
        if (!hasAdminPermission(interaction)) {
            const noPermMessage = await languageManager.getString(
                'commands.autosendoptions.noPermission',
                interaction.guildId
            ) || 'You need Administrator permission to use this command.';
            return interaction.editReply({ content: noPermMessage });
        }

        try {
            // Check if auto-send is enabled first
            const settings = await Settings.findOne({ guildId: interaction.guildId }).sort({ _id: -1 });
            if (settings?.autoSendEnabled === false) {
                const warningMsg = await languageManager.getString(
                    'commands.autosendoptions.warning.autoSendDisabled',
                    interaction.guildId
                ) || '⚠️ Auto-send is currently **disabled**. Enable it first with `/toggleautosend status:Enable`';
                
                const warningEmbed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('⚠️ Auto-Send Disabled')
                    .setDescription(warningMsg)
                    .addFields({
                        name: '💡 How to enable',
                        value: 'Run `/toggleautosend status:Enable` first, then configure these options.'
                    })
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [warningEmbed] });
            }

            const channelOption = interaction.options.getString('channel');
            const threadsOption = interaction.options.getString('threads');

            const channelEnabled = channelOption === 'enabled';
            const threadsEnabled = threadsOption === 'enabled';

            // Check if both are disabled
            if (!channelEnabled && !threadsEnabled) {
                const errorMsg = await languageManager.getString(
                    'commands.autosendoptions.error.bothDisabled',
                    interaction.guildId
                ) || '⚠️ You cannot disable both channel and threads. At least one must be enabled.';
                
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('⚠️ Invalid Configuration')
                    .setDescription(errorMsg)
                    .addFields({
                        name: '💡 Tip',
                        value: 'Enable at least one option (channel or threads) to receive codes automatically.'
                    })
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // Update settings
            await Settings.findOneAndUpdate(
                { guildId: interaction.guildId },
                { 
                    'autoSendOptions.channel': channelEnabled,
                    'autoSendOptions.threads': threadsEnabled
                },
                { upsert: true, new: true, sort: { _id: -1 } }
            );

            // Success message
            const successMsg = await languageManager.getString(
                'commands.autosendoptions.success',
                interaction.guildId
            ) || '✅ Auto-send options have been updated successfully!';

            const channelStatus = channelEnabled ? '✅ Enabled' : '❌ Disabled';
            const threadsStatus = threadsEnabled ? '✅ Enabled' : '❌ Disabled';

            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Auto-Send Options Updated!')
                .setDescription(successMsg)
                .addFields(
                    {
                        name: '📢 Main Channel',
                        value: channelStatus,
                        inline: true
                    },
                    {
                        name: '🧵 Forum Threads',
                        value: threadsStatus,
                        inline: true
                    },
                    {
                        name: '💡 How it works',
                        value: channelEnabled && threadsEnabled 
                            ? 'Codes will be posted to both your main channel and forum threads.'
                            : channelEnabled 
                            ? 'Codes will only be posted to your main channel.'
                            : 'Codes will only be posted to your forum threads.',
                        inline: false
                    }
                )
                .setFooter({ text: `Server: ${interaction.guild.name}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error in autosendoptions command:', error);
            
            const errorMsg = await languageManager.getString(
                'commands.autosendoptions.error.general',
                interaction.guildId
            ) || 'An error occurred while updating auto-send options.';

            await interaction.editReply({ content: `❌ ${errorMsg}` });
        }
    }
};
