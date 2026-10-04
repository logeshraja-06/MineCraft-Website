const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    challengeId: { type: mongoose.Schema.Types.Mixed, required: true },
    code: { type: String, required: true },
    language: { type: String, required: true },
    assembledBlockIds: [{ type: String }],
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'COMPILATION_ERROR', 'RUNTIME_ERROR'],
      default: 'PENDING',
    },
    timeTakenSeconds: { type: Number, default: 0 },
    attemptNumber: { type: Number, default: 1 },
    executionTimeMs: { type: Number, default: 0 },
    memoryKb: { type: Number, default: 0 },
    compileOutput: { type: String, default: '' },
    runtimeOutput: { type: String, default: '' },
    testCasesPassed: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    revealPenalty: { type: Number, default: 0 },
    wrongSubmissionPenalty: { type: Number, default: 0 },
    testCaseResults: [
      {
        testCaseId: { type: mongoose.Schema.Types.Mixed },
        passed: { type: Boolean, default: false },
        input: { type: String, default: '' },
        expectedOutput: { type: String, default: '' },
        actualOutput: { type: String, default: '' },
        compileError: { type: String, default: '' },
        runtimeError: { type: String, default: '' },
        isHidden: { type: Boolean, default: false },
        status: { type: String, default: '' },
        time: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Submission', submissionSchema);
