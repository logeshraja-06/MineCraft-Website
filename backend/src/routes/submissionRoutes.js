const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const protect = require('../middleware/authMiddleware');
const { submissionLimiter } = require('../middleware/rateLimit');
const { validate } = require('../middleware/validationMiddleware');
const { validateSubmission, validateRunCode } = require('../validators/submissionValidator');

// Both /run and /submit are protected with JWT auth, rate limited, and validated
router.post('/run', protect, submissionLimiter, validate(validateRunCode), submissionController.runCode);
router.post('/submit', protect, submissionLimiter, validate(validateSubmission), submissionController.submitSolution);
router.post('/', protect, submissionLimiter, validate(validateSubmission), submissionController.submitSolution);
router.get('/:id', protect, submissionController.getSubmissionById);
router.get('/history/:challengeId', protect, submissionController.getUserHistory);

module.exports = router;
