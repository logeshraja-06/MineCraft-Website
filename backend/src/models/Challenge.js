const mongoose = require('mongoose');

// ── Quiz sub-schema (used inside task quizPool) ─────────────────────────────
const quizSchema = new mongoose.Schema(
  {
    quizId: { type: String, required: true },
    type: {
      type: String,
      enum: ['MCQ', 'SHORT_ANSWER', 'OUTPUT_PREDICTION', 'FILL_BLANK', 'CODE_ORDER'],
      required: true,
    },
    prompt: { type: String, required: true },
    options: [{ type: String }], // for MCQ
    answer: { type: mongoose.Schema.Types.Mixed, required: true }, // number (MCQ index) | string | string[]
    explain: { type: String, default: '' },
    concept: { type: String, default: '' },
  },
  { _id: false }
);

// ── Task sub-schema ─────────────────────────────────────────────────────────
const taskSchema = new mongoose.Schema(
  {
    taskId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    order: { type: Number, default: 1 },
    // Quiz pool for this task – participant gets one at a time; on wrong answer cycles to next
    quizPool: [quizSchema],
    // Per-language reward: which block is unlocked when this task is completed
    rewards: {
      type: Map,
      of: String, // key = language id (e.g. 'python'), value = blockId (e.g. 'py1-f2')
      default: {},
    },
    penalty: { type: Number, default: 20 }, // seconds added on wrong answer
    cooldownSeconds: { type: Number, default: 3 }, // lockout after wrong answer
    // Legacy compat fields
    requiredBlockIds: [{ type: String }],
  },
  { _id: false }
);

// ── Per-language block configuration ────────────────────────────────────────
const langBlockConfigSchema = new mongoose.Schema(
  {
    language: { type: String, required: true }, // 'python', 'c', 'cpp', 'java'
    languageName: { type: String, default: '' }, // 'Python 3', 'C++ 17', etc.
    blocks: [
      {
        blockId: { type: String, required: true },
        code: { type: String, required: true },
        role: { type: String, default: 'LOGIC' },
        order: { type: Number, required: true }, // correct order (1-indexed)
      },
    ],
    // Order in which blocks are dispensed (shuffled from correct order)
    revealOrder: [{ type: String }],
    // Optional extra valid orderings beyond the canonical
    acceptedOrders: [[{ type: String }]],
  },
  { _id: false }
);

const challengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: { type: String, default: 'Algorithms' },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    points: { type: Number, default: 100 },
    description: { type: String, required: true },
    instructions: { type: String, default: 'Arrange the revealed code blocks in the correct logical execution order.' },
    inputFormat: { type: String, default: '' },
    outputFormat: { type: String, default: '' },
    constraints: { type: String, default: '' },
    sampleOutput: { type: String, default: '' },
    timeLimitSeconds: { type: Number, default: 1200 }, // 20 minutes default
    maxAttempts: { type: Number, default: 5 },
    supportedLanguages: [{ type: String, default: ['java', 'python', 'cpp', 'c', 'javascript'] }],
    sourceLanguage: { type: String, default: 'java' },
    sourceCode: { type: String, default: '' }, // Admin solution - never exposed to participants
    splitStrategy: { type: String, enum: ['statement', 'line', 'function', 'custom'], default: 'statement' },
    status: { type: String, enum: ['Draft', 'Published', 'Archived'], default: 'Published' },
    isActive: { type: Boolean, default: true },
    sampleInput: { type: String, default: '' },

    // ── NEW: Server-authoritative tasks ─────────────────────────────────
    tasks: [taskSchema],

    // ── NEW: Per-language block definitions ──────────────────────────────
    languageConfigs: [langBlockConfigSchema],

    // ── Canonical sequence position (1 = Easy, 2 = Medium, 3 = Hard) ──
    sequenceOrder: { type: Number, min: 1, max: 3, default: null },

    blockConfig: {
      totalBlocks: { type: Number, default: 0 },
      initialVisibleCount: { type: Number, default: 3 },
      revealMode: { type: String, enum: ['manual', 'sequential', 'timer', 'token', 'task'], default: 'task' },
      revealPenalty: { type: Number, default: 5 },
      wrongSubmissionPenalty: { type: Number, default: 2 },
      maxReveals: { type: Number, default: 10 },
      randomizeOrder: { type: Boolean, default: true },
      allowDuplicateReveal: { type: Boolean, default: false },
      partialScoring: { type: Boolean, default: true },
      timeBonus: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Unique partial index: only one challenge can hold each sequenceOrder value
challengeSchema.index(
  { sequenceOrder: 1 },
  { unique: true, partialFilterExpression: { sequenceOrder: { $type: 'number' } } }
);

// Keep isActive in sync with status
challengeSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.isActive = this.status === 'Published';
  }
  next();
});

module.exports = mongoose.model('Challenge', challengeSchema);
