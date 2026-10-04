const mongoose = require('mongoose');

const participantSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    challengeId: { type: mongoose.Schema.Types.Mixed, required: true },

    // Language & progression
    selectedLanguage: { type: String, default: 'python' },
    completedTaskIds: [{ type: String }],
    currentTaskIndex: { type: Number, default: 0 },
    currentQuizIndex: { type: Number, default: 0 },
    taskAttempts: [
      {
        taskId: { type: String },
        attempts: { type: Number, default: 0 },
        wrongAnswers: { type: Number, default: 0 },
        penaltySeconds: { type: Number, default: 0 },
        completedAt: { type: Date },
        cooldownUntil: { type: Date },
      },
    ],

    // Scanning & Assembly progression
    scannedBlocks: [{ type: mongoose.Schema.Types.Mixed }], // array of scanned block IDs / objects
    assemblyOrder: [{ type: String }],                     // block IDs arranged in participant's order
    assembledCode: { type: String, default: '' },
    revealedBlockIds: [{ type: String }],
    revealsCount: { type: Number, default: 0 },
    revealEvents: [
      {
        taskId: { type: String },
        blockId: { type: String },
        penalty: { type: Number, default: 5 },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    // Timing (server-authoritative)
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    durationSeconds: { type: Number, default: 1200 },
    isCompleted: { type: Boolean, default: false },
    scoreAwarded: { type: Number, default: 0 },
    penaltyCount: { type: Number, default: 0 },
    totalPenaltySeconds: { type: Number, default: 0 },
    wrongAttemptsCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['ACTIVE', 'IDLE', 'COMPLETED', 'EXPIRED', 'DISCONNECTED', 'SUSPICIOUS'],
      default: 'ACTIVE',
    },
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ParticipantSession', participantSessionSchema);
