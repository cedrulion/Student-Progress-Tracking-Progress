const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institutionController');
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect, authorize('institution'));

router.get('/profile', institutionController.getProfile);
router.put('/profile', institutionController.updateProfile);
router.post('/request-progress/:studentId', 
    upload.single('consentForm'), // Add this if using multer
    institutionController.requestStudentProgress
  );
router.get('/student-progress/:studentId', institutionController.getStudentProgress);
router.get('/students/:studentId/remaining-courses', institutionController.getRemainingCourses);
router.get('/students', institutionController.getAllStudents);
router.get('/requests', institutionController.getRequests);
router.post('/request-transcript/:studentId',
  upload.single('consentForm'), // Optional: if consent form is needed for transcript requests
  institutionController.requestStudentTranscript
);
router.get('/transcript-requests', institutionController.getInstitutionTranscriptRequests);
router.get('/students/:studentId/transcript/download',
  institutionController.downloadApprovedStudentTranscript
);
router.get('/students/:studentId/transcript', 
  protect, 
  authorize('institution'), 
  adminController.generateTranscript
);


module.exports = router;