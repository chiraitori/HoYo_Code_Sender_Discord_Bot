const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    genshinRole: { type: String },
    hsrRole: { type: String },
    zzzRole: { type: String },
    channel: { type: String },
    // Notification tracking to prevent spam
    notifications: {
        channelMissing: {
            notified: { type: Boolean, default: false },
            lastNotified: { type: Date, default: null }
        },
        permissionMissing: {
            notified: { type: Boolean, default: false },
            lastNotified: { type: Date, default: null },
            permission: { type: String, default: null } // Track which permission is missing
        }
    }
});

// Add index for faster lookups
configSchema.index({ guildId: 1 });

module.exports = mongoose.model('Config', configSchema);