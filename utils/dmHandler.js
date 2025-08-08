const languageManager = require('./language');

/**
 * Check if interaction is in DMs and send appropriate response for guild-only commands
 * @param {CommandInteraction} interaction - Discord command interaction
 * @param {string} commandName - Name of the command for error message
 * @returns {boolean} true if command should be blocked (is in DM), false if can continue
 */
async function handleDMRestriction(interaction, commandName = 'command') {
    // Check if interaction is in DMs (no guild)
    if (!interaction.guild) {
        // Get appropriate error message based on command
        const errorMessage = await getDMErrorMessage(interaction, commandName);
        
        await interaction.reply({ 
            content: errorMessage, 
            ephemeral: true 
        });
        
        return true; // Block command execution
    }
    
    return false; // Allow command to continue
}

/**
 * Get localized error message for DM restriction
 * @param {CommandInteraction} interaction 
 * @param {string} commandName 
 * @returns {string} Error message
 */
async function getDMErrorMessage(interaction, commandName) {
    // Try to get localized message (will use default language since no guildId in DMs)
    const errorMessage = await languageManager.getString(
        'errors.dmNotAllowed',
        null // No guildId in DMs, will use default language
    );
    
    if (errorMessage) {
        return errorMessage.replace('{command}', commandName);
    }
    
    // Fallback message in English
    return `❌ The \`/${commandName}\` command can only be used in Discord servers, not in direct messages.\n\n` +
           `Please use this command in a server where the HoYo Code Sender bot is installed.`;
}

/**
 * List of commands that require guild context (should not work in DMs)
 */
const GUILD_ONLY_COMMANDS = [
    'setup',
    'demoautosend', 
    'toggleautosend',
    'favgames',
    'checkchannels',
    'deletesetup',
    'postcode',
    'setlang'
];

/**
 * Check if a command requires guild context
 * @param {string} commandName 
 * @returns {boolean}
 */
function isGuildOnlyCommand(commandName) {
    return GUILD_ONLY_COMMANDS.includes(commandName);
}

module.exports = {
    handleDMRestriction,
    getDMErrorMessage,
    isGuildOnlyCommand,
    GUILD_ONLY_COMMANDS
};
