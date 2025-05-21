const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

// Institution routes
router.put('/verify-institution/:institutionId', adminController.verifyInstitution);
router.get('/institutions', adminController.getAllInstitutions);

// Student routes
router.get('/students', adminController.getAllStudents);
router.get('/students/:id', adminController.getStudentById);
router.get('/students/:id/courses', adminController.getStudentCourses);
router.post('/students/:id/courses', adminController.addStudentCourse);
router.delete('/students/:studentId/courses/:courseId', adminController.deleteStudentCourse);
router.put('/students/:studentId/courses/:courseId', adminController.updateStudentCourse);
router.get('/students/:id/transcript', adminController.generateTranscript);
router.post('/students/:id/transcript-requests', adminController.requestTranscript);
router.get('/students/:id/transcript-requests', adminController.getStudentTranscriptRequests);

// Request routes
router.put('/approve-transcript/:studentId/:requestId', adminController.approveTranscriptRequest);
router.put('/approve-progress/:institutionId/:requestId', adminController.approveProgressRequest);
router.get('/pending-requests', adminController.getPendingRequests);
router.get('/transcripts/pending', adminController.getPendingTranscripts);
router.get('/progress/approved', adminController.getApprovedProgressRequests);

// Count routes (for dashboard)
router.get('/students/count', adminController.getStudentCount);
router.get('/institutions/count', adminController.getInstitutionCount);
router.get('/transcripts/pending-count', adminController.getPendingTranscriptsCount);
router.get('/progress/pending-count', adminController.getPendingProgressCount);

// Dashboard stats (all in one)
router.get('/stats', adminController.getDashboardStats);

module.exports = router;