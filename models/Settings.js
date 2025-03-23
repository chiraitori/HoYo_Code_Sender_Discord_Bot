// settings.js
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    autoSendEnabled: { type: Boolean, default: true },
    gameNotifications: {
        genshin: { type: Boolean, default: true },
        hkrpg: { type: Boolean, default: true },
        nap: { type: Boolean, default: true }
    }
});

module.exports = mongoose.model('Settings', settingsSchema);