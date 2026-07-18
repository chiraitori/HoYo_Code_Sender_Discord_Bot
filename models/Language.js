const mongoose = require('mongoose');

const languageSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    language: { type: String, enum: ['en', 'jp', 'vi'], default: 'en' }
});

module.exports = mongoose.model('Language', languageSchema);
