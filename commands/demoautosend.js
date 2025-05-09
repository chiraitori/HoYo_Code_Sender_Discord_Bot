const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Config = require('../models/Config');
const Settings = require('../models/Settings');
const languageManager = require('../utils/language');
const { hasAdminPermission } = require('../utils/permissions');
const { validateChannel } = require('../utils/channelValidator');

// Game information mapping
const gameNames = {
    'genshin': 'Genshin Impact',
    'hkrpg': 'Honkai: Star Rail',
    'nap': 'Zenless Zone Zero'
};

const redeemUrls = {
    'genshin': 'https://genshin.hoyoverse.com/en/gift',
    'hkrpg': 'https://hsr.hoyoverse.com/gift',
    'nap': 'https://zenless.hoyoverse.com/redemption'
};

const roleMapping = {
    'genshin': 'genshinRole',
    'hkrpg': 'hsrRole',
    'nap': 'zzzRole'
};

// Demo codes for each game
const demoCodes = {
    'genshin': [
        { code: 'GENSHINDEMO123', rewards: 'Primogems ×60, Mora ×10000' },
        { code: 'GSDEMO456', rewards: 'Hero\'s Wit ×5, Mystic Enhancement Ore ×10' }
    ],
    'hkrpg': [
        { code: 'HSRDEMO123', rewards: 'Stellar Jade ×60, Credits ×10000' },
        { code: 'HSRDEMO456', rewards: 'Traveler\'s Guide ×5, Refined Aether ×10' }
    ],
    'nap': [
        { code: 'ZZZDEMO123', rewards: 'Poly ×60, Master Tapes ×10000' },
        { code: 'ZZZDEMO456', rewards: 'Level Up Material ×5, Weapon Enhancement Material ×10' }
    ]
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('demoautosend')
        .setDescription('Send demo code notifications to test the auto-send functionality')
        .addStringOption(option =>
            option.setName('game')
                .setDescription('Select game for demo codes')
                .setRequired(true)
                .addChoices(
                    { name: 'Genshin Impact', value: 'genshin' },
                    { name: 'Honkai: Star Rail', value: 'hkrpg' },
                    { name: 'Zenless Zone Zero', value: 'nap' },
                    { name: 'All Games', value: 'all' }
                )),

    async execute(interaction) {
        // Check if user is admin
        if (!hasAdminPermission(interaction)) {
            const noPermMessage = await languageManager.getString(
                'commands.demoautosend.noPermission',
                interaction.guildId
            ) || 'You need administrator permissions to use this command.';
            return interaction.reply({ content: noPermMessage, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            // Get guild configuration
            const config = await Config.findOne({ guildId: interaction.guildId });
            if (!config || !config.channel) {
                const noConfigMessage = await languageManager.getString(
                    'commands.demoautosend.noConfig', 
                    interaction.guildId
                ) || 'Bot is not set up yet! Please use `/setup` first to configure a channel.';
                return interaction.editReply({ content: noConfigMessage });
            }

            // Validate the channel
            const validationResult = await validateChannel(interaction.client, interaction.guildId);
            if (!validationResult.isValid) {
                const channelErrorMsg = await languageManager.getString(
                    'commands.demoautosend.channelError',
                    interaction.guildId
                ) || 'Cannot send messages to the configured channel:';
                
                return interaction.editReply({ 
                    content: `${channelErrorMsg} ${validationResult.error}` 
                });
            }

            // Get the game option
            const selectedGame = interaction.options.getString('game');
            
            // Determine games to send demo codes for
            const gamesToProcess = selectedGame === 'all' 
                ? ['genshin', 'hkrpg', 'nap'] 
                : [selectedGame];
            
            const channel = interaction.client.channels.cache.get(config.channel);
            const sentMessages = [];
            
            // Process each selected game
            for (const game of gamesToProcess) {
                const title = await languageManager.getString(
                    'commands.demoautosend.title',
                    interaction.guildId,
                    { game: gameNames[game] }
                ) || `🔔 Demo ${gameNames[game]} Codes!`;

                const redeemText = await languageManager.getString(
                    'commands.listcodes.redeemButton',
                    interaction.guildId
                ) || 'Redeem';

                // Generate descriptions for each code
                const descriptions = [];
                
                for (const code of demoCodes[game]) {
                    const rewardString = await languageManager.getRewardString(code.rewards, interaction.guildId) 
                        || `Reward: ${code.rewards}`;
                    
                    descriptions.push(
                        `**${code.code}** (DEMO)\n` +
                        `[${redeemText}](${redeemUrls[game]}?code=${code.code})\n` +
                        `└ ${rewardString}`
                    );
                }
                
                const finalDescription = descriptions.join('\n\n');

                // Get support message in the server's language
                const supportMsg = await languageManager.getString(
                    'common.supportMsg', 
                    interaction.guildId
                ) || '❤️ Support: ko-fi.com/chiraitori | paypal.me/chiraitori';
                
                // Create embedded message
                const embed = new EmbedBuilder()
                    .setColor('#FF9900') // Orange color for demo messages
                    .setTitle(title)
                    .setDescription(finalDescription)
                    .setFooter({ 
                        text: supportMsg + ' | DEMO CODE (NOT ACTUAL)',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();

                // Include a notice that these are demo codes
                embed.addFields({ 
                    name: await languageManager.getString('commands.demoautosend.notice', interaction.guildId) || '⚠️ Demo Notice',
                    value: await languageManager.getString('commands.demoautosend.noticeText', interaction.guildId) || 
                        'These are demo codes for testing purposes only. They will not work in-game.'
                });

                // Get role to mention
                const roleField = roleMapping[game];
                const roleId = config[roleField];
                const roleTag = roleId ? `<@&${roleId}> ` : '';

                // Send the message
                const sentMessage = await channel.send({ content: roleTag, embeds: [embed] });
                sentMessages.push(`${gameNames[game]}: <${sentMessage.url}>`);
            }

            // Notify the admin that demo codes were sent
            const successMessage = await languageManager.getString(
                'commands.demoautosend.success',
                interaction.guildId,
                { count: sentMessages.length }
            ) || `Successfully sent demo codes for ${sentMessages.length} game(s)!`;

            await interaction.editReply({
                content: `${successMessage}\n\n${sentMessages.join('\n')}`
            });

        } catch (error) {
            console.error('Error sending demo codes:', error);
            const errorMessage = await languageManager.getString(
                'commands.demoautosend.error',
                interaction.guildId
            ) || 'An error occurred while sending demo codes.';
            
            await interaction.editReply({ 
                content: `${errorMessage}\n\`\`\`${error.message}\`\`\`` 
            });
        }
    }
};
