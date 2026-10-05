const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

exports.login = asyncHandler(async (req, res) => {
  const { email, password, participantId, teamName } = req.body || {};

  const cleanEmail = email ? String(email).trim().toLowerCase() : null;
  const cleanId = participantId ? String(participantId).trim().toUpperCase() : null;
  const cleanTeam = teamName ? String(teamName).trim() : null;

  const query = [];
  if (cleanEmail) query.push({ email: cleanEmail });
  if (cleanId) query.push({ participantId: cleanId });
  if (cleanTeam) query.push({ teamName: cleanTeam });

  if (query.length === 0) {
    return res.status(400).json({ success: false, message: 'Please provide email or participant details' });
  }

  const user = await User.findOne({ $or: query });

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials or user not found' });
  }

  // Admin users must verify password
  if (user.role === 'admin') {
    if (!password || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }
  } else if (password) {
    // If password was provided by participant, verify it
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }
  }

  res.json({
    success: true,
    token: generateToken(user._id, user.role),
    user: {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      participantId: user.participantId,
      role: user.role,
      teamName: user.teamName,
      college: user.college,
      department: user.department,
    },
  });
});

exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, role: 'admin' });

  if (user && (await user.matchPassword(password))) {
    res.json({
      success: true,
      token: generateToken(user._id, 'admin'),
      user: { id: user._id, name: user.name, email: user.email, role: 'admin' },
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }
});

exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

exports.logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});
