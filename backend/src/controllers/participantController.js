const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Event = require('../models/Event');
const generateToken = require('../utils/generateToken');
const { validateParticipantRegister } = require('../validators/participantValidator');

exports.registerParticipant = asyncHandler(async (req, res) => {
  const { name, participantId, email, college, department, sessionCode } = req.body || {};

  // 1. Validation
  const validationErrors = validateParticipantRegister(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      message: validationErrors[0],
      errors: validationErrors,
    });
  }

  const cleanName = name.trim();
  const cleanParticipantId = participantId.trim().toUpperCase();
  const cleanEmail = email.trim().toLowerCase();
  const cleanCollege = college.trim();
  const cleanDepartment = department.trim();

  // 2. Uniqueness checks with clear 409 messages
  const existingId = await User.findOne({ participantId: cleanParticipantId });
  if (existingId) {
    return res.status(409).json({
      success: false,
      message: `Participant ID '${cleanParticipantId}' is already registered. Please use your unique ID.`,
    });
  }

  const existingEmail = await User.findOne({ email: cleanEmail });
  if (existingEmail) {
    return res.status(409).json({
      success: false,
      message: `Email address '${cleanEmail}' is already registered. Please use another email or log in.`,
    });
  }

  // 3. Optional session code lookup (null-safe)
  let event = null;
  if (sessionCode && typeof sessionCode === 'string' && sessionCode.trim()) {
    event = await Event.findOne({ sessionCode: sessionCode.trim().toUpperCase() });
  }

  // 4. Create user with random secure password
  const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!';
  const user = await User.create({
    name: cleanName,
    participantId: cleanParticipantId,
    email: cleanEmail,
    password: randomPassword,
    college: cleanCollege,
    department: cleanDepartment,
    teamName: cleanParticipantId,
    role: 'participant',
    eventId: event?._id,
  });

  const token = generateToken(user._id, 'participant');

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      _id: user._id,
      name: user.name,
      participantId: user.participantId,
      email: user.email,
      college: user.college,
      department: user.department,
      role: 'participant',
    },
  });
});

exports.getStatus = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const user = await User.findById(req.user._id).select('-password');
  res.json({
    success: true,
    status: 'ACTIVE',
    user,
  });
});
