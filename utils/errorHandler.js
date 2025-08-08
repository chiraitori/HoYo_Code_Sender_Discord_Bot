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
        
        const reply = {
            content: errorMessage,
            ephemeral: true
        };

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(reply);
        } else {
            await interaction.reply(reply);
        }
    } catch (replyError) {
        console.error('Failed to send error message:', replyError);
        // Last resort - try to send a basic error message
        try {
            const basicReply = { content: fallbackMessage, ephemeral: true };
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(basicReply);
            } else {
                await interaction.reply(basicReply);
            }
        } catch (lastError) {
            console.error('Complete failure to respond to interaction:', lastError);
        }
    }
}

/**
 * Standardized success handler for command interactions
 * @param {CommandInteraction} interaction - Discord interaction
 * @param {string} messageKey - Language key for success message
 * @param {string} fallbackMessage - Fallback message if language key fails
 * @param {Object} replacements - Replacements for message placeholders
 * @param {boolean} ephemeral - Whether the message should be ephemeral
 */
async function handleCommandSuccess(interaction, messageKey, fallbackMessage, replacements = {}, ephemeral = false) {
    try {
        let message = await languageManager.getString(messageKey, interaction.guildId) || fallbackMessage;
        
        // Apply replacements
        Object.entries(replacements).forEach(([key, value]) => {
            message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        });
        
        const reply = {
            content: message,
            ephemeral
        };

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(reply);
        } else {
            await interaction.reply(reply);
        }
    } catch (error) {
        console.error('Failed to send success message:', error);
        await handleCommandError(interaction, error, 'errors.general', 'Command completed but failed to send confirmation.');
    }
}

/**
 * Validate if user has required permissions
 * @param {CommandInteraction} interaction - Discord interaction
 * @param {Array<string>} requiredPermissions - Array of required permission strings
 * @param {string} errorKey - Language key for permission error
 * @returns {boolean} Whether user has permissions
 */
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
