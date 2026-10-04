const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const protect = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

// All admin routes require valid JWT auth AND admin role
router.use(protect, requireAdmin);

// Dashboard & Overview
router.get('/overview', adminController.getOverview);

// Challenge Management
router.get('/challenges', adminController.getChallenges);
router.post('/challenges', adminController.createChallenge);
router.get('/challenges/:id', adminController.getChallengeById);
router.put('/challenges/:id', adminController.updateChallenge);
router.delete('/challenges/:id', adminController.deleteChallenge);
router.post('/challenges/:id/duplicate', adminController.duplicateChallenge);

// Code Blocks
router.post('/challenges/:id/generate-blocks', adminController.generateBlocks);
router.get('/challenges/:id/blocks', adminController.getChallengeBlocks);
router.put('/challenges/:id/blocks', adminController.updateChallengeBlocks);

// Test Cases
router.get('/challenges/:id/test-cases', adminController.getTestCases);
router.post('/challenges/:id/test-cases', adminController.updateTestCases);

// Participants Management
router.get('/participants', adminController.getParticipants);
router.get('/participants/:id', adminController.getParticipantById);
router.put('/participants/:id/status', adminController.toggleParticipantStatus);
router.post('/participants/:id/reset', adminController.resetParticipant);
router.delete('/participants/:id', adminController.deleteParticipant);


// Live Sessions
router.get('/sessions', adminController.getSessions);
router.post('/sessions/:id/end', adminController.endSession);
router.post('/sessions/:id/extend', adminController.extendSession);
router.post('/sessions/:id/reset', adminController.resetSession);

// Submissions Audit
router.get('/submissions', adminController.getSubmissions);
router.get('/submissions/:id', adminController.getSubmissionById);

// Leaderboard
router.get('/leaderboard', adminController.getLeaderboard);
router.get('/leaderboard/export', adminController.exportLeaderboard);
router.post('/leaderboard/freeze', adminController.freezeLeaderboardToggle);

// Reports & Exports (Real files generated)
router.get('/participants/export', adminController.exportParticipants);
router.get('/reports/export/excel', adminController.exportExcel);
router.get('/reports/export/pdf', adminController.exportPdf);

// QR Generation
router.post('/challenges/:id/generate-qr', adminController.generateChallengeQRs);

// Settings & Security
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);
router.put('/change-password', adminController.changePassword);

module.exports = router;

