const mongoose = require('mongoose');

const qrBlockSchema = new mongoose.Schema(
  {
    challengeId: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
    title: { type: String, default: '' },
    language: { type: String, required: true, lowercase: true },
    code: { type: String, required: true },
    type: {
      type: String,
      default: 'LOGIC',
    },
    isDecoy: { type: Boolean, default: false },
    correctOrder: { type: Number, required: true },
    qrToken: { type: String, required: true, unique: true, index: true },

    // Legacy and helper fields
    blockId: { type: String },
    originalOrder: { type: Number },
    displayOrder: { type: Number },
    qrHash: { type: String },
    codeSnippet: { type: String },
    blockType: { type: String },
    locationHint: { type: String },
    hint: { type: String, default: '' },
    points: { type: Number, default: 10 },
  },
  { timestamps: true }
);

// Keep aliases in sync before save
qrBlockSchema.pre('save', function (next) {
  if (this.code && !this.codeSnippet) this.codeSnippet = this.code;
  if (this.codeSnippet && !this.code) this.code = this.codeSnippet;

  if (this.qrToken && !this.qrHash) this.qrHash = this.qrToken;
  if (this.qrHash && !this.qrToken) this.qrToken = this.qrHash;

  if (this.correctOrder !== undefined && this.originalOrder === undefined) {
    this.originalOrder = this.correctOrder;
  }
  if (this.originalOrder !== undefined && this.correctOrder === undefined) {
    this.correctOrder = this.originalOrder;
  }

  if (this.type && !this.blockType) this.blockType = this.type;
  if (this.blockType && !this.type) this.type = this.blockType;

  next();
});

module.exports = mongoose.model('QRBlock', qrBlockSchema);
