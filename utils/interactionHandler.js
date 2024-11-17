const handleInteraction = async (interaction, handler) => {
    await interaction.deferReply({ ephemeral: true });
    
    try {
        await handler();
    } catch (error) {
        console.error('Command error:', error);
        const errorMessage = await languageManager.getString(
            'errors.general',
            interaction.guildId
        );
        await interaction.editReply({ content: errorMessage });
    }
};