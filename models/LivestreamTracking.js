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
 * 5 = Found (one or more codes need delivery)
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
    distributedBots: {
        type: [String],
        default: []
    },
    distributedTargets: {
        type: [String],
        default: []
    },
    distributedCodeTargets: {
        type: [String],
        default: []
    },
    codes: [{
        code: String,
        title: String,
        expireAt: Number, // Unix timestamp
        discoveredAt: Number // Unix timestamp
    }],
    source: {
        type: String,
        enum: ['hoyolab', 'youtube', 'hoyolab+youtube'],
        default: 'hoyolab'
    },
    postId: {
        type: String,
        default: null
    },
    bannerUrl: {
        type: String,
        default: null
    },
    youtubeVideoId: {
        type: String,
        default: null
    },
    youtubeUrl: {
        type: String,
        default: null
    },
    youtubeStatus: {
        type: String,
        enum: ['live', 'upcoming', 'completed', 'unknown'],
        default: 'unknown'
    },
    youtubeStreams: [{
        locale: {
            type: String,
            enum: ['en', 'ja']
        },
        channelId: String,
        videoId: String,
        url: String,
        title: String,
        status: {
            type: String,
            enum: ['live', 'upcoming', 'completed', 'unknown'],
            default: 'unknown'
        },
        scheduledStartTime: String
    }],
    streamTimeEstimated: {
        type: Boolean,
        default: false
    },
    announcementSent: {
        type: Boolean,
        default: false
    },
    announcementBots: {
        type: [String],
        default: []
    },
    announcementTargets: {
        type: [String],
        default: []
    },
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
livestreamTrackingSchema.index({ game: 1, streamTime: -1 });

module.exports = mongoose.model('LivestreamTracking', livestreamTrackingSchema);
