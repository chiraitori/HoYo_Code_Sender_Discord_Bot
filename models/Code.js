const mongoose = require('mongoose');

const codeSchema = new mongoose.Schema({
    game: { type: String, required: true },
    code: { type: String, required: true },
    isExpired: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Code', codeSchema);