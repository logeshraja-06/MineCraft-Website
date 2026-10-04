const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const protect = require('../middleware/authMiddleware');

router.use(protect);

router.post('/scan', qrController.scanBlock);
router.get('/scanned/:challengeId', qrController.getScannedBlocks);

module.exports = router;
