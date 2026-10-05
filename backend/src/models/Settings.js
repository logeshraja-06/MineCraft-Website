const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    competitionName: { type: String, default: 'MindCraft Blind Coding Championship 2026' },
    startDate: { type: Date, default: () => new Date() },
    endDate: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    duration: { type: Number, default: 60 }, // minutes
    maxParticipants: { type: Number, default: 100 },
    defaultChallengeTime: { type: Number, default: 20 }, // minutes
    allowLateJoin: { type: Boolean, default: true },
    allowReattempt: { type: Boolean, default: true },
    revealPenalty: { type: Number, default: 5 },
    wrongSubmissionPenalty: { type: Number, default: 2 },
    leaderboardVisibility: { type: String, enum: ['Public', 'AdminOnly', 'Frozen'], default: 'AdminOnly' },
    autoSubmit: { type: Boolean, default: true },
    sessionTimeout: { type: Number, default: 60 }, // minutes
    enforceProgression: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
