const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');
const optionalAuth = require('../middleware/optionalAuth');

router.post('/register', participantController.registerParticipant);
router.post('/join', participantController.registerParticipant);
router.get('/status', participantController.getStatus);
router.delete('/me', optionalAuth, participantController.deleteMe);
router.post('/logout-delete', optionalAuth, participantController.deleteMe);

module.exports = router;

