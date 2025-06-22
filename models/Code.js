const mongoose = require('mongoose');

const codeSchema = new mongoose.Schema({
    game: { type: String, required: true },
    code: { type: String, required: true },
    isExpired: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});

// Add compound index for faster lookups by game and code
codeSchema.index({ game: 1, code: 1 }, { unique: true });
// Add index for expiration queries
codeSchema.index({ isExpired: 1 });
// Add index for timestamp-based queries
codeSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Code', codeSchema);