const asyncHandler = require('../utils/asyncHandler');
const { getLeaderboardData } = require('../services/leaderboard/leaderboardService');
const Settings = require('../models/Settings');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

async function isCallerAdmin(req) {
  if (req.user && req.user.role === 'admin') return true;
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('role').lean();
    return user?.role === 'admin';
  } catch (_) {
    return false;
  }
}

exports.getLeaderboard = asyncHandler(async (req, res) => {
  const settings = await Settings.findOne().lean();
  const visibility = settings?.leaderboardVisibility || 'AdminOnly';
  const isAdmin = await isCallerAdmin(req);

  if (visibility === 'AdminOnly' && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'The competition leaderboard is restricted to event administrators only.',
    });
  }

  const rankings = await getLeaderboardData();
  res.json({ success: true, rankings });
});

exports.getMyRank = asyncHandler(async (req, res) => {
  const settings = await Settings.findOne().lean();
  const visibility = settings?.leaderboardVisibility || 'AdminOnly';
  const isAdmin = await isCallerAdmin(req);

  if (visibility === 'AdminOnly' && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Rankings are restricted to event administrators only.',
    });
  }

  const rankings = await getLeaderboardData();
  const myRank = rankings.findIndex((r) => r.id.toString() === req.user?._id.toString()) + 1;
  res.json({ success: true, rank: myRank || null });
});
