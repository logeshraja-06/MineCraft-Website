const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const protect = require('../middleware/authMiddleware');

router.use(protect);

router.post('/start', sessionController.startSession);
router.put('/assembly', sessionController.saveAssembly);
router.get('/current/:challengeId', sessionController.getCurrentSession);
router.get('/my-sessions', sessionController.getUserSessions);

module.exports = router;
