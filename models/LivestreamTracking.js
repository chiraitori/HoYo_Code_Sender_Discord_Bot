const mongoose = require('mongoose');

/**
 * LivestreamTracking Model
 * Tracks livestream code hunting state for each game
 * 
 * States:
 * 0 = Disabled
 * 1 = No Schedule
 * 2 = Not yet live
 * 3 = Distributed
 * 4 = Searching (actively polling API)
 * 5 = Found (all codes found)
 */
const livestreamTrackingSchema = new mongoose.Schema({
    game: {
        type: String,
        required: true,
        enum: ['genshin', 'hkrpg', 'nap']
    },
    version: {
        type: String,
        required: true
    },
    streamTime: {
        type: Number, // Unix timestamp
        default: 0
    },
    disabled: {
        type: Boolean,
        default: false
    },
    found: {
        type: Boolean,
        default: false
    },
    distributed: {
        type: Boolean,
        default: false
    },
    codes: [{
        code: String,
        expireAt: Number, // Unix timestamp
        discoveredAt: Number // Unix timestamp
    }],
    trackingChannel: {
        type: String, // Channel ID where tracking message is posted
        default: null
    },
    trackingMessage: {
        type: String, // Message ID of tracking message
        default: null
    },
    lastChecked: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for game + version lookup
livestreamTrackingSchema.index({ game: 1, version: 1 }, { unique: true });

module.exports = mongoose.model('LivestreamTracking', livestreamTrackingSchema);
