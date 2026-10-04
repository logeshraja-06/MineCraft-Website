const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const protect = require('../middleware/authMiddleware');

router.get('/', leaderboardController.getLeaderboard);
router.get('/my-rank', protect, leaderboardController.getMyRank);

module.exports = router;

