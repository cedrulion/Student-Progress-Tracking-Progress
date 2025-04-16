const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('student'));

router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);
router.post('/transcript-request', studentController.requestTranscript);
router.get('/transcript-requests', studentController.getTranscriptRequests);

module.exports = router;