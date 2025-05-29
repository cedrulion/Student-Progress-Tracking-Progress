// institutionController.js

const Institution = require('../models/Institution');
const Student = require('../models/Student');
const pdf = require('html-pdf');
const path = require('path');
const fs = require('fs');

// Helper function to get user ID consistently
const getUserId = (user) => {
  return user._id || user.id;
};

// Get institution profile
exports.getProfile = async (req, res, next) => {
  console.log('User making request:', req.user);
  try {
    const userId = getUserId(req.user);
    const institution = await Institution.findOne({ userId: userId }).populate('userId');
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    res.status(200).json({ success: true, data: institution });
  } catch (err) {
    next(err);
  }
};

// Update institution profile
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = getUserId(req.user);
    const institution = await Institution.findOneAndUpdate(
      { userId: userId },
      req.body,
      { new: true, runValidators: true }
    ).populate('userId');

    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    res.status(200).json({ success: true, data: institution });
  } catch (err) {
    next(err);
  }
};

// Request student progress
exports.requestStudentProgress = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // Get user ID consistently
    const userId = getUserId(req.user);

    const institution = await Institution.findOne({ userId: userId });
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    // Check if institution is verified
    if (institution.verificationStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        message: 'Your institution needs to be verified first'
      });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Check if request already exists
    const existingRequest = institution.requestedStudents.find(
      req => req.student.toString() === studentId
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You have already requested this student\'s progress'
      });
    }

    // Create new request with data from FormData
    const newRequest = {
      student: studentId,
      purpose: req.body.purpose,
      justification: req.body.justification,
      requestedData: Array.isArray(req.body.requestedData)
        ? req.body.requestedData
        : [req.body.requestedData].filter(Boolean)
    };

    // Handle file upload if exists
    if (req.file) {
      newRequest.consentForm = req.file.path;
    }

    institution.requestedStudents.push(newRequest);
    await institution.save();

    res.status(201).json({ success: true, data: institution });
  } catch (err) {
    next(err);
  }
};

// Get student progress (if approved)
exports.getStudentProgress = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const userId = getUserId(req.user);
    const institution = await Institution.findOne({ userId: userId });
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    // Find approved request for this student
    const approvedRequest = institution.requestedStudents.find(
      req => req.student.toString() === studentId && req.status === 'approved'
    );

    if (!approvedRequest) {
      return res.status(403).json({
        success: false,
        message: 'You don\'t have permission to view this student\'s progress'
      });
    }

    const student = await Student.findById(studentId).select('-transcriptRequests');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(200).json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
};

// Get all students
exports.getAllStudents = async (req, res, next) => {
  try {
    const students = await Student.find().select('firstName lastName studentId department program');
    res.status(200).json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
};

// Get institution's requests
exports.getRequests = async (req, res, next) => {
  try {
    const userId = getUserId(req.user);
    const institution = await Institution.findOne({ userId: userId })
      // Populate more student fields to ensure data is available
      .populate('requestedStudents.student', 'firstName lastName studentId department program');
    // We don't need to explicitly select supportingDocuments here if it's already part of the requestedStudents subdocument schema.
    // However, it's good to ensure it's there on the model if not already.

    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    res.status(200).json({ success: true, data: institution.requestedStudents });
  } catch (err) {
    next(err);
  }
};

exports.requestStudentTranscript = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { purpose, justification } = req.body;

    const userId = getUserId(req.user);
    const institution = await Institution.findOne({ userId: userId });

    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    if (institution.verificationStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        message: 'Your institution needs to be verified first to request transcripts.'
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Check if transcript request already exists and is pending or approved
    const existingTranscriptRequest = institution.transcriptRequests.find(
      req => req.student.toString() === studentId && (req.status === 'pending' || req.status === 'approved')
    );

    if (existingTranscriptRequest) {
      return res.status(400).json({
        success: false,
        message: 'A transcript request for this student is already pending or approved.'
      });
    }

    const newTranscriptRequest = {
      student: studentId,
      purpose,
      justification,
    };

    if (req.file) { // Assuming a consent form might be uploaded for transcripts too
      newTranscriptRequest.consentForm = req.file.path;
    }

    institution.transcriptRequests.push(newTranscriptRequest);
    await institution.save();

    res.status(201).json({
      success: true,
      message: 'Transcript request submitted successfully. Awaiting admin approval.',
      data: newTranscriptRequest
    });

  } catch (err) {
    next(err);
  }
};

// NEW: Get Institution's Transcript Requests
exports.getInstitutionTranscriptRequests = async (req, res, next) => {
  try {
    const userId = getUserId(req.user);
    const institution = await Institution.findOne({ userId: userId })
      .populate('transcriptRequests.student', 'firstName lastName studentId program department');

    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    res.status(200).json({ success: true, data: institution.transcriptRequests });
  } catch (err) {
    next(err);
  }
};

// NEW: Download Approved Student Transcript
exports.downloadApprovedStudentTranscript = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const userId = getUserId(req.user);

    // Find the institution and populate its transcript requests to check status
    // Populate 'transcriptRequests.student' to get student details for the PDF
    const institution = await Institution.findOne({ userId: userId })
      .populate('transcriptRequests.student');

    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }

    // Crucial: Check for an approved transcript request for this student by this institution
    const approvedRequest = institution.transcriptRequests.find(
      reqItem => reqItem.student && reqItem.student._id.toString() === studentId && reqItem.status === 'approved'
    );

    if (!approvedRequest) {
      // If no approved request is found, deny access
      return res.status(403).json({
        success: false,
        message: 'You do not have an approved transcript request for this student or the request is not yet approved.'
      });
    }

    // Get the student object directly from the populated approved request
    const student = approvedRequest.student;

    if (!student) {
      // This is a fallback, should ideally not happen if populate worked correctly
      return res.status(404).json({ success: false, message: 'Student data not available in the approved request.' });
    }

    // --- Start PDF Generation Logic (adapted from your admin's generateTranscript) ---

    // Sort courses by year and semester (corrected semester comparison for strings)
    const sortedCourses = [...student.courses].sort((a, b) => {
      if (a.yearTaken !== b.yearTaken) {
        return a.yearTaken - b.yearTaken;
      }
      // Assuming semester is a string (e.g., "Fall", "Spring"). Use localeCompare.
      // If it's a number, ensure your data stores numbers and revert to `a.semester - b.semester`.
      return a.semester.localeCompare(b.semester);
    });

    // Calculate GPA
    const gradePoints = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'E': 0.5, 'F': 0 };
    let totalPoints = 0;
    let totalCredits = 0;

    student.courses.forEach(course => {
      // Ensure grade exists and is in gradePoints map
      if (gradePoints[course.grade] !== undefined) {
        totalPoints += gradePoints[course.grade] * course.credits;
        totalCredits += course.credits;
      }
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 'N/A';

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
          <h1>Requested by ${institution.name}</h1>
          <h2>University of Rwanda</h2> </div>

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
      },
      // phantomPath: '/path/to/phantomjs/bin/phantomjs' // Uncomment and set if you have issues with phantomjs path
    };

    // Generate PDF
    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        console.error('PDF generation error:', err);
        return res.status(500).json({ success: false, message: 'Failed to generate transcript PDF. Please check server logs.' });
      }

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=transcript_${student.studentId}.pdf`,
        'Content-Length': buffer.length
      });

      res.send(buffer); // Send the PDF buffer
    });

  } catch (err) {
    console.error('Error in downloadApprovedStudentTranscript:', err);
    // Ensure all unhandled errors also send a JSON response
    res.status(500).json({ success: false, message: 'Internal server error during transcript download.' });
  }
};