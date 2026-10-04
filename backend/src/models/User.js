const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    participantId: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      sparse: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['admin', 'participant', 'judge'], default: 'participant' },
    college: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: '' },
    teamName: { type: String, trim: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
