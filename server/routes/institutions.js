const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institutionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('institution'));

router.get('/profile', institutionController.getProfile);
router.put('/profile', institutionController.updateProfile);
router.post('/request-progress', institutionController.requestStudentProgress);
router.get('/student-progress/:studentId', institutionController.getStudentProgress);
router.get('/students', institutionController.getAllStudents);
router.get('/requests', institutionController.getRequests);

module.exports = router;