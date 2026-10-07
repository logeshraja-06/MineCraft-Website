const mongoose = require('mongoose');

const qrBlockSchema = new mongoose.Schema(
  {
    challengeId: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
    title: { type: String, default: '' },
    language: { type: String, required: true, lowercase: true },
    code: {
      type: String,
      required: true,
      default: function () {
        return this.codeSnippet || '';
      },
    },
    type: {
      type: String,
      default: 'LOGIC',
    },
    isDecoy: { type: Boolean, default: false },
    correctOrder: {
      type: Number,
      required: true,
      default: function () {
        return this.originalOrder !== undefined ? this.originalOrder : 1;
      },
    },
    qrToken: {
      type: String,
      required: true,
      index: true,
      default: function () {
        return this.qrHash || `MCQR-${Math.random().toString(36).substring(2, 12)}`;
      },
    },

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

function syncAliases(doc) {
  if (!doc) return;

  const codeVal = doc.code !== undefined && doc.code !== null && doc.code !== ''
    ? doc.code
    : (doc.codeSnippet !== undefined ? doc.codeSnippet : '');
  doc.code = codeVal;
  doc.codeSnippet = codeVal;

  const orderVal = doc.correctOrder !== undefined
    ? doc.correctOrder
    : (doc.originalOrder !== undefined
      ? doc.originalOrder
      : (doc.order !== undefined ? doc.order : 1));
  doc.correctOrder = orderVal;
  doc.originalOrder = orderVal;

  const tokenVal = doc.qrToken || doc.qrHash || `MCQR-${doc.challengeId || 'chal'}-${doc.blockId || 'B01'}-${Math.random().toString(36).substring(2, 8)}`;
  doc.qrToken = tokenVal;
  doc.qrHash = tokenVal;

  const typeVal = doc.type || doc.blockType || doc.role || 'LOGIC';
  doc.type = typeVal;
  doc.blockType = typeVal;

  if (doc.language) {
    doc.language = String(doc.language).toLowerCase();
  }
}

// Sync aliases on validate (runs before document validation on doc.save())
qrBlockSchema.pre('validate', function (next) {
  syncAliases(this);
  next();
});

// Sync aliases before save
qrBlockSchema.pre('save', function (next) {
  syncAliases(this);
  next();
});

// Sync aliases before insertMany (runs on Model.insertMany())
qrBlockSchema.pre('insertMany', function (next, docs) {
  if (Array.isArray(docs)) {
    docs.forEach(syncAliases);
  }
  next();
});

module.exports = mongoose.model('QRBlock', qrBlockSchema);
