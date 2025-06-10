// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const {
  protect,
  authorize
} = require('../middleware/auth');
const {
  upload
} = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.put('/verify-institution/:institutionId', adminController.verifyInstitution);
router.get('/institutions', adminController.getAllInstitutions);
router.get('/students', adminController.getAllStudents);
router.get('/students/:id', adminController.getStudentById);

router.post('/courses', adminController.addCourse);
router.get('/courses', adminController.getAllCourses); // New route for getAllCourses
router.put('/courses/:id', adminController.updateCourse); // New route for updateCourse
router.delete('/courses/:id', adminController.deleteCourse); // New route for deleteCourse

router.post('/students/:studentId/assign-course', adminController.assignCourseToStudent);
router.get('/students/:studentId/remaining-courses', adminController.getRemainingCourses);

router.get('/students/:id/courses', adminController.getStudentCourses);
router.delete('/students/:studentId/courses/:studentCourseId', adminController.deleteStudentCourse);
router.put('/students/:studentId/courses/:studentCourseId', adminController.updateStudentCourse);

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

router.get('/pending-requests', adminController.getPendingRequests);
router.get('/transcripts/pending', adminController.getPendingTranscripts);
router.get('/progress/approved', adminController.getApprovedProgressRequests);

router.get('/students/count', adminController.getStudentCount);
router.get('/institutions/count', adminController.getInstitutionCount);
router.get('/transcripts/pending-count', adminController.getPendingTranscriptsCount);
router.get('/progress/pending-count', adminController.getPendingProgressCount);
router.get('/stats', adminController.getDashboardStats);
router.post('/students/:id/transcript-requests', adminController.requestTranscript);
router.get('/students/:id/transcript-requests', adminController.getStudentTranscriptRequests);
router.get('/transcripts/approved', adminController.getApprovedTranscripts);

module.exports = router;