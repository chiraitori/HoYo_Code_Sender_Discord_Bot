const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    genshinRole: { type: String },
    hsrRole: { type: String },
    zzzRole: { type: String },
    channel: { type: String },
});

module.exports = mongoose.model('Config', configSchema);