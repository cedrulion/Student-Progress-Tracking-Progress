const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../controllers/adminController');


router.use(protect, authorize('admin'));


router.put('/verify-institution/:institutionId', adminController.verifyInstitution);
router.get('/institutions', adminController.getAllInstitutions);


router.get('/students', adminController.getAllStudents);
router.get('/students/:id', adminController.getStudentById);
router.get('/students/:id/courses', adminController.getStudentCourses);
router.post('/students/:id/courses', adminController.addStudentCourse);
router.delete('/students/:studentId/courses/:courseId', adminController.deleteStudentCourse);
router.put('/students/:studentId/courses/:courseId', adminController.updateStudentCourse);


router.get('/students/:id/transcript', adminController.generateTranscript);


router.put(
  '/transcript-requests/:institutionId/:requestId',
  upload.array('supportingDocuments'), 
  adminController.respondToTranscriptRequest
);

router.put(
  '/progress-requests/:institutionId/:requestId',
  upload.array('supportingDocuments'), 
  adminController.approveProgressRequest
);

// Routes to get all pending requests
router.get('/pending-requests', adminController.getPendingRequests);
router.get('/transcripts/pending', adminController.getPendingTranscripts);
router.get('/progress/approved', adminController.getApprovedProgressRequests);

// Dashboard Count routes
router.get('/students/count', adminController.getStudentCount);
router.get('/institutions/count', adminController.getInstitutionCount);
router.get('/transcripts/pending-count', adminController.getPendingTranscriptsCount);
router.get('/progress/pending-count', adminController.getPendingProgressCount);
router.get('/stats', adminController.getDashboardStats);

router.post('/students/:id/transcript-requests', adminController.requestTranscript);
router.get('/students/:id/transcript-requests', adminController.getStudentTranscriptRequests);
router.get('/transcripts/approved', adminController.getApprovedTranscripts);


module.exports = router;