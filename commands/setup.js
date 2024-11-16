const { SlashCommandBuilder } = require('@discordjs/builders');
const Config = require('../models/Config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup roles and channel for code notifications')
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
                .setRequired(true)),
    async execute(interaction) {
        const config = await Config.findOneAndUpdate(
            { guildId: interaction.guildId },
            {
                genshinRole: interaction.options.getRole('genshin_role').id,
                hsrRole: interaction.options.getRole('hsr_role').id,
                zzzRole: interaction.options.getRole('zzz_role').id,
                channel: interaction.options.getChannel('channel').id
            },
            { upsert: true, new: true }
        );

        await interaction.reply({ 
            content: 'Setup completed successfully!',
            ephemeral: true 
        });
        
    },
};