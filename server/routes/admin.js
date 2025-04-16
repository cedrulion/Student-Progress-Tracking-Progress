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

// Request routes
router.put('/approve-transcript/:studentId/:requestId', adminController.approveTranscriptRequest);
router.put('/approve-progress/:institutionId/:requestId', adminController.approveProgressRequest);
router.get('/pending-requests', adminController.getPendingRequests);
router.get('/transcripts/pending', adminController.getPendingTranscripts);
router.get('/transcripts/pending-count', adminController.getPendingTranscripts);

// Dashboard routes
router.get('/stats', adminController.getDashboardStats);
router.get('/students/count', adminController.getDashboardStats);
router.get('/institutions/count', adminController.getDashboardStats);
router.get('/progress/pending-count', adminController.getDashboardStats);

module.exports = router;