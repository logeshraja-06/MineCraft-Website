const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const gameplayController = require('../controllers/gameplayController');
const optionalAuth = require('../middleware/optionalAuth');
const protect = require('../middleware/authMiddleware');

// ── Progression info ──
router.get('/progress', protect, challengeController.getUserProgress);

// ── Public challenge info ──
router.get('/', challengeController.getChallenges);
router.get('/active', challengeController.getActiveChallenge);
router.get('/:id', challengeController.getChallengeById);
router.get('/:id/blocks', optionalAuth, challengeController.getParticipantBlocks);
router.post('/:id/reveal', optionalAuth, challengeController.revealBlock);

// ── Server-authoritative gameplay ──
router.post('/:id/start-session', protect, gameplayController.startSession);
router.get('/:id/current-task', protect, gameplayController.getCurrentTask);
router.post('/:id/submit-task', protect, gameplayController.submitTaskAnswer);
router.get('/:id/progress', protect, gameplayController.getProgress);

module.exports = router;

