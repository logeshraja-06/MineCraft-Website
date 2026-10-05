const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Event = require('../models/Event');
const Submission = require('../models/Submission');
const ParticipantSession = require('../models/ParticipantSession');
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

  // 2. Uniqueness & Resumption checks
  const existingId = await User.findOne({ participantId: cleanParticipantId });
  const existingEmail = await User.findOne({ email: cleanEmail });

  // 2a. If BOTH exist and refer to the SAME user, or if auto-login is needed:
  // allow the participant to seamlessly log back in and resume their session!
  if (existingId && existingEmail && existingId._id.toString() === existingEmail._id.toString()) {
    if (cleanName) existingId.name = cleanName;
    if (cleanCollege) existingId.college = cleanCollege;
    if (cleanDepartment) existingId.department = cleanDepartment;
    await existingId.save();

    const token = generateToken(existingId._id, 'participant');
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: existingId._id,
        _id: existingId._id,
        name: existingId.name,
        participantId: existingId.participantId,
        email: existingId.email,
        college: existingId.college,
        department: existingId.department,
        role: 'participant',
      },
      message: `Welcome back, ${existingId.name}! Existing session loaded.`,
    });
  }

  // 2b. If participantId is already taken by someone else
  if (existingId) {
    return res.status(409).json({
      success: false,
      message: `Participant ID '${cleanParticipantId}' is already registered. Please use your unique ID or log in.`,
    });
  }

  // 2c. If email is already taken by someone else
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

exports.deleteMe = asyncHandler(async (req, res) => {
  let user = null;
  if (req.user?._id) {
    user = await User.findById(req.user._id);
  }

  // Fallback to participantId or email from body/query/headers if user is not found via token
  const participantId = req.body?.participantId || req.query?.participantId || req.headers['x-participant-id'];
  const email = req.body?.email || req.query?.email;

  if (!user && participantId) {
    user = await User.findOne({ participantId: String(participantId).trim().toUpperCase() });
  }
  if (!user && email) {
    user = await User.findOne({ email: String(email).trim().toLowerCase() });
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Participant account not found or already deleted.',
    });
  }

  const targetUserId = user._id;

  // Delete User, ParticipantSession, and Submissions
  await Promise.all([
    User.findByIdAndDelete(targetUserId),
    ParticipantSession.deleteMany({ userId: targetUserId }),
    Submission.deleteMany({ userId: targetUserId }),
  ]);

  res.json({
    success: true,
    message: `Participant '${user.name}' (${user.participantId || user.email}) and all test progress deleted successfully.`,
  });
});

exports.loginParticipant = asyncHandler(async (req, res) => {
  const { email, participantId, phone } = req.body || {};
  const cleanEmail = email ? String(email).trim().toLowerCase() : null;
  const cleanId = (participantId || phone) ? String(participantId || phone).trim().toUpperCase() : null;

  if (!cleanEmail && !cleanId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide your registered Email or Phone/Participant ID.',
    });
  }

  const query = [];
  if (cleanEmail) query.push({ email: cleanEmail });
  if (cleanId) query.push({ participantId: cleanId });

  const user = await User.findOne({ $or: query, role: 'participant' });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No registered participant found with these details. Please register first.',
    });
  }

  const token = generateToken(user._id, 'participant');
  res.json({
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
    message: `Welcome back, ${user.name}!`,
  });
});


