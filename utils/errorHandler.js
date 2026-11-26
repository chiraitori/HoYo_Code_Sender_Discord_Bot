const { MessageFlags } = require('discord.js');
const languageManager = require('./language');

/**
 * Standardized error handler for command interactions
 * @param {CommandInteraction} interaction - Discord interaction
 * @param {Error} error - The error that occurred
 * @param {string} errorKey - Language key for error message
 * @param {string} fallbackMessage - Fallback message if language key fails
 */
async function handleCommandError(interaction, error, errorKey = 'errors.general', fallbackMessage = 'An error occurred.') {
    console.error(`Error in ${interaction.commandName} command:`, error);

    try {
        const errorMessage = await languageManager.getString(errorKey, interaction.guildId) || fallbackMessage;

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: errorMessage });
        } else {
            await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
        }
    } catch (replyError) {
        console.error('Failed to send error message:', replyError);
        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: fallbackMessage });
            } else {
                await interaction.reply({ content: fallbackMessage, flags: MessageFlags.Ephemeral });
            }
        } catch (lastError) {
            console.error('Complete failure to respond to interaction:', lastError);
        }
    }
}

/**
 * Standardized success handler for command interactions
 */
async function handleCommandSuccess(interaction, messageKey, fallbackMessage, replacements = {}, ephemeral = false) {
    try {
        let message = await languageManager.getString(messageKey, interaction.guildId) || fallbackMessage;

        Object.entries(replacements).forEach(([key, value]) => {
            message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        });

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: message });
        } else {
            await interaction.reply({
                content: message,
                ...(ephemeral ? { flags: MessageFlags.Ephemeral } : {})
            });
        }
    } catch (error) {
        console.error('Failed to send success message:', error);
        await handleCommandError(interaction, error, 'errors.general', 'Command completed but failed to send confirmation.');
    }
}

async function checkPermissions(interaction, requiredPermissions = ['Administrator'], errorKey = 'errors.noPermission') {
    if (!interaction.member?.permissions.has(requiredPermissions)) {
        await handleCommandError(
            interaction,
            new Error('Insufficient permissions'),
            errorKey,
            'You do not have permission to use this command.'
        );
        return false;
    }
    return true;
}

module.exports = {
    handleCommandError,
    handleCommandSuccess,
    checkPermissions
};
