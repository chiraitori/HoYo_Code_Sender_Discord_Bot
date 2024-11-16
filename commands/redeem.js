const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Config = require('../models/Config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('redeem')
        .setDescription('Show redeem instructions and codes')
        .setDefaultMemberPermissions(PermissionFlagsBits.ADMINISTRATOR), // Only admins can use

    async execute(interaction) {
        // Check if user is admin or owner
        if (!interaction.member.permissions.has(PermissionFlagsBits.ADMINISTRATOR)) {
            return interaction.reply({ 
                content: 'You do not have permission to use this command.', 
                ephemeral: true 
            });
        }

        const modal = new ModalBuilder()
            .setCustomId('redeemModal')
            .setTitle('Add Redemption Codes');

        const gameInput = new TextInputBuilder()
            .setCustomId('game')
            .setLabel('Select Game (genshin/hsr/zzz)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const codeInput1 = new TextInputBuilder()
            .setCustomId('code1')
            .setLabel('Code 1 (Required)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const codeInput2 = new TextInputBuilder()
            .setCustomId('code2')
            .setLabel('Code 2 (Optional)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const codeInput3 = new TextInputBuilder()
            .setCustomId('code3')
            .setLabel('Code 3 (Optional)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const messageInput = new TextInputBuilder()
            .setCustomId('message')
            .setLabel('Additional Message (Optional)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setMaxLength(1000);

        const firstRow = new ActionRowBuilder().addComponents(gameInput);
        const secondRow = new ActionRowBuilder().addComponents(codeInput1);
        const thirdRow = new ActionRowBuilder().addComponents(codeInput2);
        const fourthRow = new ActionRowBuilder().addComponents(codeInput3);
        const fifthRow = new ActionRowBuilder().addComponents(messageInput);

        modal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);
        await interaction.showModal(modal);
    },
    
    // Add modal submit handling
    async modalSubmit(interaction) {
        const gameNames = {
            'genshin': 'Genshin Impact',
            'hsr': 'Honkai: Star Rail',
            'zzz': 'Zenless Zone Zero'
        };

        const roleMappings = {
            'genshin': 'genshinRole',
            'hsr': 'hsrRole',
            'zzz': 'zzzRole'
        };

        const game = interaction.fields.getTextInputValue('game').toLowerCase();
        const code1 = interaction.fields.getTextInputValue('code1');
        const code2 = interaction.fields.getTextInputValue('code2');
        const code3 = interaction.fields.getTextInputValue('code3');
        const message = interaction.fields.getTextInputValue('message');

        const codes = [code1];
        if (code2) codes.push(code2);
        if (code3) codes.push(code3);

        try {
            // Fetch config from MongoDB
            const config = await Config.findOne({ guildId: interaction.guild.id });
            if (!config || !config.channel) {
                return interaction.reply({
                    content: 'Error: Channel not configured for this server.',
                    ephemeral: true
                });
            }

            const channel = interaction.guild.channels.cache.get(config.channel);
            if (!channel) {
                return interaction.reply({
                    content: 'Error: Could not find the configured channel.',
                    ephemeral: true
                });
            }

            const roleId = config[roleMappings[game]];
            const roleTag = roleId ? `<@&${roleId}> ` : '';

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Redemption Codes for ${gameNames[game]}`)
                .setDescription(codes.map(code => {
                    const redeemLinks = {
                        'genshin': `https://genshin.hoyoverse.com/en/gift?code=${code}`,
                        'hsr': `https://hsr.hoyoverse.com/gift?code=${code}`,
                        'zzz': `https://zenless.hoyoverse.com/redemption?code=${code}`
                    };

                    return `**${code}**\n[Click to Redeem](${redeemLinks[game]})`;
                }).join('\n\n'))
                .setFooter({ text: 'Click on the links above to redeem these codes' });

            if (message) {
                embed.addFields({ name: 'Message', value: message });
            }

            // Send to channel with role mention
            await channel.send({ 
                content: roleTag,
                embeds: [embed]
            });

            await interaction.reply({ 
                content: 'Codes have been posted successfully!',
                ephemeral: true 
            });

        } catch (error) {
            console.error('Error:', error);
            await interaction.reply({
                content: 'Error occurred while processing the command.',
                ephemeral: true
            });
        }
    }
};
