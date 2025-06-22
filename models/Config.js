const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    genshinRole: { type: String },
    hsrRole: { type: String },
    zzzRole: { type: String },
    channel: { type: String },
});

// Add index for faster lookups
configSchema.index({ guildId: 1 });

module.exports = mongoose.model('Config', configSchema);