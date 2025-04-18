// utils/permissions.js - Utility functions for permission checking
const { PermissionFlagsBits } = require('discord.js');

/**
 * Checks if a user is the bot owner
 * @param {string} userId - Discord user ID to check
 * @returns {boolean} - True if the user is the bot owner
 */
function isOwner(userId) {
    return userId === process.env.OWNER_ID;
}

/**
 * Checks if a user has permission to use admin commands
 * @param {Interaction} interaction - Discord interaction object
 * @returns {boolean} - True if the user has admin permissions or is the bot owner
 */
function hasAdminPermission(interaction) {
    // Bot owner can use all commands
    if (isOwner(interaction.user.id)) {
        return true;
    }
    
    // Otherwise, check guild-specific permissions
    return interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) || false;
}

module.exports = {
    isOwner,
    hasAdminPermission
};