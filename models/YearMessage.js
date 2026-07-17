// YearMessage.js
const mongoose = require('mongoose');

const yearMessageSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    lastYearSent: { type: Number, required: true },
    sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('YearMessage', yearMessageSchema);
