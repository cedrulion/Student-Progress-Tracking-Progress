const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('student'));

router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);
router.get('/transcript', studentController.getStudentTranscript);
router.get('/transcript/download', studentController.downloadTranscript);


module.exports = router;