const mongoose = require('mongoose');

const participantSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    challengeId: { type: mongoose.Schema.Types.Mixed, required: true },

    // Language & progression
    selectedLanguage: { type: String, default: 'python' },
    completedTaskIds: [{ type: String }],
    taskOrder: [{ type: String }],                         // Shuffled task IDs sequence for this session
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
        answerRevealed: { type: Boolean, default: false },
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

    // Assembly execution / run count tracking
    runCount: { type: Number, default: 0 },                // total test runs in assembly
    runPenaltyPoints: { type: Number, default: 0 },        // -10 pts per run after first 3 free runs

    // Points system (0 initially, negative penalties)
    taskPenaltyPoints: { type: Number, default: 0 },       // -20 pts per wrong MCQ / fill blank
    timePenaltyPoints: { type: Number, default: 0 },       // -10 pts per 1 min exhausted
    totalPenaltyPoints: { type: Number, default: 0 },      // total negative points accumulated
    currentScore: { type: Number, default: 0 },            // 0 - totalPenaltyPoints

    // Timing (server-authoritative)
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    durationSeconds: { type: Number, default: 900 },       // 15 minutes = 900 seconds
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
