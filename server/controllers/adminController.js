const Student = require('../models/Student');
const Institution = require('../models/Institution');
const User = require('../models/User');
const pdf = require('html-pdf'); 
const fs = require('fs');
const path = require('path');

const getUserId = (user) => {
  return user._id || user.id;
};

// Verify institution
exports.verifyInstitution = async (req, res, next) => {
  try {
    const { institutionId } = req.params;
    const { status } = req.body; // 'verified' or 'rejected'

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status provided.' });
    }

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    institution.verificationStatus = status;
    await institution.save();

    res.status(200).json({ success: true, data: institution });
  } catch (err) {
    next(err);
  }
};

// NEW: Approve/Reject an Institution's Transcript Request
// This now correctly targets the transcriptRequests array on the Institution model
exports.respondToTranscriptRequest = async (req, res, next) => {
  try {
    const { institutionId, requestId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided. Must be "approved" or "rejected".' });
    }

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }

    const transcriptRequest = institution.transcriptRequests.id(requestId);
    if (!transcriptRequest) {
      return res.status(404).json({ success: false, message: 'Transcript request not found within this institution.' });
    }

    // Only allow status change if it's currently pending
    if (transcriptRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request is already ${transcriptRequest.status}.` });
    }

    transcriptRequest.status = status;
    // Optional: Add a processedAt timestamp
    transcriptRequest.processedAt = new Date();
    await institution.save();

    res.status(200).json({
      success: true,
      message: `Transcript request for student ${transcriptRequest.student} by ${institution.name} has been ${status}.`,
      data: transcriptRequest
    });

  } catch (err) {
    console.error('Error responding to transcript request:', err);
    next(err);
  }
};


// Approve institution's student progress request
exports.approveProgressRequest = async (req, res, next) => {
  try {
    const { institutionId, requestId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided. Must be "approved" or "rejected".' });
    }

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    const request = institution.requestedStudents.id(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Progress request not found.' });
    }

    // Only allow status change if it's currently pending
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Progress request is already ${request.status}.` });
    }

    request.status = status;
    request.processedAt = new Date(); // Add processedAt timestamp
    await institution.save();

    res.status(200).json({ success: true, data: institution });
  } catch (err) {
    console.error('Error approving progress request:', err);
    next(err);
  }
};

// Get all institutions
exports.getAllInstitutions = async (req, res, next) => {
  try {
    const institutions = await Institution.find().populate('userId', 'email role'); // Populate user info
    res.status(200).json({ success: true, data: institutions });
  } catch (err) {
    next(err);
  }
};

// Get all students
exports.getAllStudents = async (req, res, next) => {
  try {
    const students = await Student.find().populate('userId', 'email role'); // Populate user info
    res.status(200).json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
};

// Get student by ID
exports.getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('userId', 'email role');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.status(200).json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
};

// Get student courses
exports.getStudentCourses = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.status(200).json({ success: true, data: student.courses });
  } catch (err) {
    next(err);
  }
};

// Add course to student
exports.addStudentCourse = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.courses.push(req.body);
    await student.save();

    res.status(201).json({ success: true, data: student.courses });
  } catch (err) {
    next(err);
  }
};

// Delete student course
exports.deleteStudentCourse = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.courses = student.courses.filter(
      course => course._id.toString() !== req.params.courseId
    );
    await student.save();

    res.status(200).json({ success: true, data: student.courses });
  } catch (err) {
    next(err);
  }
};

// Get all pending requests (transcript and progress)
exports.getPendingRequests = async (req, res, next) => {
  try {
    // Get transcript requests from Institutions
    const institutionsWithPendingTranscripts = await Institution.find({
      'transcriptRequests.status': 'pending'
    }).populate('transcriptRequests.student', 'firstName lastName studentId program department');

    const transcriptRequests = [];
    institutionsWithPendingTranscripts.forEach(institution => {
      institution.transcriptRequests.forEach(request => {
        if (request.status === 'pending' && request.student) { // Ensure student data is populated
          transcriptRequests.push({
            _id: request._id,
            institution: {
              _id: institution._id,
              name: institution.name,
              contactEmail: institution.contactEmail,
              verificationStatus: institution.verificationStatus
            },
            student: {
              _id: request.student._id,
              firstName: request.student.firstName,
              lastName: request.student.lastName,
              studentId: request.student.studentId,
              program: request.student.program,
              department: request.student.department
            },
            requestDate: request.requestDate,
            purpose: request.purpose,
            justification: request.justification, // Add justification from model
            consentForm: request.consentForm // Add consentForm from model
          });
        }
      });
    });

    // Get progress requests from Institutions
    const institutionsWithPendingProgress = await Institution.find({
      'requestedStudents.status': 'pending'
    }).populate('requestedStudents.student', 'firstName lastName studentId program department');

    const progressRequests = [];
    institutionsWithPendingProgress.forEach(institution => {
      institution.requestedStudents.forEach(request => {
        if (request.status === 'pending' && request.student) {
          progressRequests.push({
            _id: request._id,
            institution: {
              _id: institution._id,
              name: institution.name,
              contactEmail: institution.contactEmail,
              verificationStatus: institution.verificationStatus
            },
            student: {
              _id: request.student._id,
              firstName: request.student.firstName,
              lastName: request.student.lastName,
              studentId: request.student.studentId,
              program: request.student.program,
              department: request.student.department
            },
            requestDate: request.requestDate,
            purpose: request.purpose,
            justification: request.justification,
            requestedData: request.requestedData,
            consentForm: request.consentForm
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      data: {
        transcriptRequests,
        progressRequests
      }
    });
  } catch (err) {
    console.error('Error in getPendingRequests:', err);
    next(err);
  }
};

// Get pending transcript requests (specific to transcripts, from Institutions)
exports.getPendingTranscripts = async (req, res, next) => {
  try {
    const institutions = await Institution.find({ 'transcriptRequests.status': 'pending' })
      .populate('transcriptRequests.student', 'firstName lastName studentId program department');

    const requests = institutions.flatMap(institution =>
      institution.transcriptRequests
        .filter(req => req.status === 'pending')
        .map(req => ({
          ...req.toObject(),
          institution: {
            _id: institution._id,
            name: institution.name,
            contactEmail: institution.contactEmail
          },
          student: {
            _id: req.student._id,
            firstName: req.student.firstName,
            lastName: req.student.lastName,
            studentId: req.student.studentId
          }
        }))
    );

    res.status(200).json({ success: true, data: requests });
  } catch (err) {
    console.error('Error in getPendingTranscripts:', err);
    next(err);
  }
};

// Dashboard statistics - Individual count endpoints
exports.getStudentCount = async (req, res, next) => {
  try {
    const count = await Student.countDocuments();
    res.status(200).json({ success: true, count });
  } catch (err) {
    next(err);
  }
};

exports.getInstitutionCount = async (req, res, next) => {
  try {
    const count = await Institution.countDocuments();
    res.status(200).json({ success: true, count });
  } catch (err) {
    next(err);
  }
};

// Count of pending transcript requests (from Institutions)
exports.getPendingTranscriptsCount = async (req, res, next) => {
  try {
    const count = await Institution.countDocuments({ 'transcriptRequests.status': 'pending' });
    res.status(200).json({ success: true, count });
  } catch (err) {
    next(err);
  }
};

exports.getPendingProgressCount = async (req, res, next) => {
  try {
    const count = await Institution.countDocuments({ 'requestedStudents.status': 'pending' });
    res.status(200).json({ success: true, count });
  } catch (err) {
    next(err);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [studentsCount, institutionsCount, pendingTranscripts, pendingProgress] = await Promise.all([
      Student.countDocuments(),
      Institution.countDocuments(),
      Institution.countDocuments({ 'transcriptRequests.status': 'pending' }), // Corrected
      Institution.countDocuments({ 'requestedStudents.status': 'pending' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        students: studentsCount,
        institutions: institutionsCount,
        pendingTranscripts,
        pendingProgress
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getApprovedProgressRequests = async (req, res, next) => {
  try {
  
    const institutions = await Institution.find({
      'requestedStudents.status': 'approved'
    }).populate('requestedStudents.student', 'firstName lastName studentId program department');


    const approvedRequests = institutions.flatMap(institution =>
      institution.requestedStudents
        .filter(student => student.status === 'approved')
        .map(request => ({ 
          _id: request._id,
          institution: {
            _id: institution._id,
            name: institution.name,
            contactEmail: institution.contactEmail,
            verificationStatus: institution.verificationStatus
          },
          student: {
            _id: request.student._id,
            firstName: request.student.firstName,
            lastName: request.student.lastName,
            studentId: request.student.studentId,
            program: request.student.program,
            department: request.student.department
          },
          requestDate: request.requestDate,
          processedAt: request.processedAt, 
          purpose: request.purpose,
          justification: request.justification,
          requestedData: request.requestedData,
          consentForm: request.consentForm,
          status: request.status
        }))
    );

    res.status(200).json({
      success: true,
      data: approvedRequests
    });
  } catch (err) {
    console.error('Error in getApprovedProgressRequests:', err);
    next(err);
  }
};

// Update student information
exports.updateStudentCourse = async (req, res, next) => {
  try {
    const { studentId, courseId } = req.params;
    const updateData = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const course = student.courses.id(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Update course fields
    Object.assign(course, updateData);
    await student.save();

    res.status(200).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
};


exports.generateTranscript = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id).populate('userId').populate('institution'); // Populate institution if it's a ref

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Sort courses by year and semester
    const sortedCourses = [...student.courses].sort((a, b) => {
      if (a.yearTaken !== b.yearTaken) {
        return a.yearTaken - b.yearTaken;
      }
      return a.semester - b.semester;
    });

    // Calculate GPA
    const gradePoints = {
      'A': 4, 'B': 3, 'C': 2, 'D': 1, 'E': 0.5, 'F': 0
    };
    let totalPoints = 0;
    let totalCredits = 0;

    student.courses.forEach(course => {
      totalPoints += gradePoints[course.grade] * course.credits;
      totalCredits += course.credits;
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

    // HTML template for transcript
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Transcript - ${student.firstName} ${student.lastName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .student-info { margin-bottom: 30px; }
          .student-info table { width: 100%; border-collapse: collapse; }
          .student-info td { padding: 5px; border: 1px solid #ddd; }
          .course-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .course-table th, .course-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .course-table th { background-color: #f2f2f2; }
          .footer { text-align: right; margin-top: 30px; font-style: italic; }
          .gpa { font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>OFFICIAL TRANSCRIPT</h1>
          <h2>${student.institution ? student.institution.name : 'University Name'}</h2>
        </div>
        
        <div class="student-info">
          <table>
            <tr>
              <td><strong>Student Name:</strong></td>
              <td>${student.firstName} ${student.lastName}</td>
              <td><strong>Student ID:</strong></td>
              <td>${student.studentId}</td>
            </tr>
            <tr>
              <td><strong>Program:</strong></td>
              <td>${student.program || 'N/A'}</td>
              <td><strong>Department:</strong></td>
              <td>${student.department || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Date of Birth:</strong></td>
              <td>${student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</td>
              <td><strong>Date Issued:</strong></td>
              <td>${new Date().toLocaleDateString()}</td>
            </tr>
          </table>
        </div>
        
        <table class="course-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Course Name</th>
              <th>Semester</th>
              <th>Year</th>
              <th>Credits</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            ${sortedCourses.map(course => `
              <tr>
                <td>${course.code}</td>
                <td>${course.name}</td>
                <td>${course.semester}</td>
                <td>${course.yearTaken}</td>
                <td>${course.credits}</td>
                <td>${course.grade}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="gpa">
          Cumulative GPA: ${gpa}
        </div>
        
        <div class="footer">
          <p>This is an official document. Any alteration makes it invalid.</p>
          <p>Registrar's Signature: _________________________</p>
        </div>
      </body>
      </html>
    `;

    // PDF options
    const options = {
      format: 'Letter',
      border: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    };

    // Generate PDF
    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        console.error('PDF generation error:', err);
        return next(err);
      }

      // Set response headers
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=transcript_${student.studentId}.pdf`,
        'Content-Length': buffer.length
      });

      // Send the PDF
      res.send(buffer);
    });
  } catch (err) {
    console.error('Error generating transcript:', err);
    next(err);
  }
};

exports.requestTranscript = async (req, res, next) => {
  try {
    const { id } = req.params; 
    const { purpose, institutionId } = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const institution = await Institution.findById(institutionId);
    if (!institution) {
        return res.status(404).json({ success: false, message: 'Target institution not found for request.' });
    }

    // Check if a similar request already exists
    const existingRequest = institution.transcriptRequests.find(
        req => req.student.toString() === student._id.toString() && req.status === 'pending'
    );

    if (existingRequest) {
        return res.status(400).json({ success: false, message: 'A pending transcript request to this institution already exists for this student.' });
    }

    const newRequest = {
      requestDate: new Date(),
      purpose,
      student: student._id, // Add student ID to the request on Institution model
      status: 'pending'
    };

    institution.transcriptRequests.push(newRequest);
    await institution.save();

    res.status(201).json({ success: true, message: 'Transcript request sent to institution.', data: newRequest });
  } catch (err) {
    console.error('Error in requestTranscript (admin acting):', err);
    next(err);
  }
};

// This function seems out of place here. Students should get their own requests via studentController.
exports.getStudentTranscriptRequests = async (req, res, next) => {
  try {
    const { id } = req.params; // This `id` would be the student's ID
    const student = await Student.findById(id); // Only find the student, not requests from institution.

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // To get all transcript requests related to a student, you'd query Institution model
    const institutionsWithStudentRequests = await Institution.find({
        'transcriptRequests.student': id
    }).populate('transcriptRequests.student', 'firstName lastName studentId'); // Populate student for context

    const studentRelatedRequests = [];
    institutionsWithStudentRequests.forEach(inst => {
        inst.transcriptRequests.forEach(req => {
            if (req.student.toString() === id) {
                studentRelatedRequests.push({
                    _id: req._id,
                    institution: {
                        _id: inst._id,
                        name: inst.name
                    },
                    requestDate: req.requestDate,
                    purpose: req.purpose,
                    status: req.status
                });
            }
        });
    });

    res.status(200).json({ success: true, data: studentRelatedRequests });
  } catch (err) {
    console.error('Error in getStudentTranscriptRequests (admin looking up student requests):', err);
    next(err);
  }
};
exports.getApprovedTranscripts = async (req, res, next) => {
  try {
    const institutions = await Institution.find({ 'transcriptRequests.status': 'approved' })
      .populate('transcriptRequests.student', 'firstName lastName studentId program department');

    const requests = institutions.flatMap(institution =>
      institution.transcriptRequests
        .filter(req => req.status === 'approved')
        .map(req => ({
          ...req.toObject(),
          institution: {
            _id: institution._id,
            name: institution.name,
            contactEmail: institution.contactEmail,
            verificationStatus: institution.verificationStatus // Include verification status
          },
          student: {
            _id: req.student._id,
            firstName: req.student.firstName,
            lastName: req.student.lastName,
            studentId: req.student.studentId,
            program: req.student.program,
            department: req.student.department
          }
        }))
    );

    res.status(200).json({ success: true, data: requests });
  } catch (err) {
    console.error('Error in getApprovedTranscripts:', err);
    next(err);
  }
};