// institutionController.js

const Institution = require('../models/Institution');
const { Student, Course } = require('../models/Student');
const pdf = require('html-pdf');
const path = require('path');
const fs = require('fs');

// Helper function to get user ID consistently
const getUserId = (user) => {
  return user._id || user.id;
};
const SEMESTER_ORDER = {
  'Semester 1': 1,
  'Semester 2': 2,
  'Summer': 3,
  'Year-long': 4 
};
const GRADE_POINTS_5_SCALE = {
  'A': 5,
  'B': 4,
  'C': 3,
  'D': 2,
  'E': 1,
  'F': 0,
  'N/A': 0 
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

    // --- IMPORTANT FIX HERE ---
    // Populate the 'course' field within the 'courses' array to get course details
    const student = await Student.findById(studentId)
      .select('-transcriptRequests')
      .populate('courses.course'); // <--- ADDED THIS LINE

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
      .populate('requestedStudents.student', 'firstName lastName studentId department program');
    
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
    const {
      studentId
    } = req.params;
    const userId = getUserId(req.user);

    // Find the institution and populate its transcript requests to check status
    // Populate 'transcriptRequests.student' to get student details for the PDF
    const institution = await Institution.findOne({
      userId: userId
    })
      .populate('transcriptRequests.student');

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found.'
      });
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
    // Ensure to populate courses.course here as well for the PDF generation
    const student = await Student.findById(studentId).populate('courses.course'); // <--- Ensure this is populated here too for PDF

    if (!student) {
      // This is a fallback, should ideally not happen if populate worked correctly
      return res.status(404).json({
        success: false,
        message: 'Student data not available in the approved request.'
      });
    }

    // --- Start PDF Generation Logic (adapted from your admin's generateTranscript) ---

    // Group courses by sc.course.year
    const coursesByYear = student.courses.reduce((acc, studentCourse) => {
      const year = studentCourse.course && studentCourse.course.year ? studentCourse.course.year.toString() : 'N/A';
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(studentCourse);
      return acc;
    }, {});

    const sortedYears = Object.keys(coursesByYear).sort((a, b) => {
      if (a === 'N/A') return 1; // N/A years go to the end
      if (b === 'N/A') return -1;
      return parseInt(a) - parseInt(b);
    });

    // Sort courses within each year by semester taken
    sortedYears.forEach(year => {
      coursesByYear[year].sort((a, b) => {
        const semesterA = a.semesterTaken || 'N/A';
        const semesterB = b.semesterTaken || 'N/A';
        return (SEMESTER_ORDER[semesterA] || 99) - (SEMESTER_ORDER[semesterB] || 99); // Handle undefined semesters
      });
    });

    // Calculate GPA (using your provided GPA scale: A=5, B=4, etc.)
    let totalPoints = 0;
    let totalCredits = 0;

    student.courses.forEach(studentCourse => {
      // Ensure courseDetails are available from population and grade exists in map
      if (studentCourse.course && GRADE_POINTS_5_SCALE[studentCourse.grade] !== undefined) {
        totalPoints += GRADE_POINTS_5_SCALE[studentCourse.grade] * studentCourse.course.credits;
        totalCredits += studentCourse.course.credits;
      }
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';

    const retakeCount = student.courses.filter(course => course.isRetake).length;

    let retakeWarning = '';
    if (retakeCount >= 3) {
      retakeWarning = `
        <div class="retake-warning">
          <p><strong>IMPORTANT NOTICE:</strong> This student has accumulated <strong>${retakeCount} retakes</strong>, which exceeds the maximum allowed retakes at the University of Rwanda. Consequently, this student is <strong>no longer eligible to continue their studies</strong> at the University.</p>
        </div>
      `;
    }

    // HTML template for transcript
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Transcript - ${student.firstName} ${student.lastName}</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; margin: 0; padding: 20px; font-size: 11pt; }
          .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #000; padding-bottom: 12px; }
          .header h1 { font-size: 20pt; color: #333; margin-bottom: 5px; }
          .header h2 { font-size: 14pt; color: #555; margin-top: 0; }
          .student-info { margin-bottom: 25px; border: 1px solid #ddd; padding: 15px; background-color: #f9f9f9; }
          .student-info table { width: 100%; border-collapse: collapse; }
          .student-info td { padding: 8px 12px; border: 1px solid #eee; }
          .student-info strong { color: #333; }
          .course-section { margin-bottom: 25px; page-break-inside: avoid; }
          .course-year-heading {
            font-size: 16pt;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 15px;
            padding: 8px 0;
            border-bottom: 2px solid #3498db;
          }
          .course-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .course-table th, .course-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          .course-table th { background-color: #e0f2f7; color: #2c3e50; font-weight: bold; }
          .grade-F { color: #e74c3c; font-weight: bold; }
          .grade-pass { color: #27ae60; font-weight: bold; }
          .retake-row { background-color: #ffebee; } /* Light red for retake rows */
          .retake-status { color: #c0392b; font-weight: bold; } /* Darker red for 'Yes' */
          .gpa-section { text-align: right; margin-top: 25px; padding: 15px; background-color: #ecf0f1; border-radius: 5px; border: 1px solid #c7d0d6; }
          .gpa-section p { font-size: 14pt; font-weight: bold; color: #2980b9; margin: 0; }
          .footer { text-align: center; margin-top: 40px; font-style: italic; color: #7f8c8d; font-size: 10pt; }
          .retake-warning {
            border: 2px solid #e74c3c;
            background-color: #fbecec;
            color: #c0392b;
            padding: 15px;
            margin-bottom: 30px;
            text-align: center;
            font-size: 12pt;
            font-weight: bold;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>OFFICIAL ACADEMIC TRANSCRIPT</h1>
          <h2>University of Rwanda</h2>
          <h1>Requested by ${institution.name}</h1>
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
              <td><strong>Date Issued:</strong></td>
              <td>${new Date().toLocaleDateString('en-GB')}</td>
              <td></td>
              <td></td>
            </tr>
          </table>
        </div>

        ${retakeWarning}

        ${sortedYears.map(year => `
          <div class="course-section">
            <h3 class="course-year-heading">Academic Year: ${year}</h3>
            <div class="overflow-x-auto">
              <table class="course-table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Grade</th>
                    <th>Retake</th>
                    <th>Marks</th>
                    <th>Semester</th>
                    <th>Year</th>
                    <th>Credits</th>
                  </tr>
                </thead>
                <tbody>
                  ${coursesByYear[year].map(sc => `
                    <tr class="${sc.isRetake ? 'retake-row' : ''}">
                      <td>${sc.course ? sc.course.code : 'N/A'}</td>
                      <td>${sc.course ? sc.course.name : 'N/A'}</td>
                      <td class="${sc.grade === 'F' || sc.grade === 'E' ? 'grade-F' : 'grade-pass'}">${sc.grade}</td>
                      <td class="${sc.isRetake ? 'retake-status' : ''}">${sc.isRetake ? 'Yes' : 'No'}</td>
                      <td>${sc.marks !== undefined ? sc.marks : 'N/A'}</td>
                      <td>${sc.semesterTaken || 'N/A'}</td>
                      <td>${sc.course ? sc.course.year : 'N/A'}</td>
                      <td>${sc.course ? sc.course.credits : 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `).join('')}

        <div class="gpa-section">
          <p>Cumulative GPA: ${gpa}</p>
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
    };

    // Generate PDF
    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        console.error('PDF generation error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to generate transcript PDF. Please check server logs.'
        });
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
    res.status(500).json({
      success: false,
      message: 'Internal server error during transcript download.'
    });
  }
};
exports.getRemainingCourses = async (req, res, next) => {
  try {
    const {
      studentId
    } = req.params;

    const student = await Student.findById(studentId).populate('courses.course');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const allCourses = await Course.find();
    const studentCompletedCourseIds = student.courses
      .filter(sc => ['A', 'B', 'C', 'D'].includes(sc.grade))
      .map(sc => sc.course._id.toString());

    const remainingCourses = allCourses.filter(course => {
      const isAlreadyTaken = student.courses.some(sc => sc.course._id.toString() === course._id.toString());
      if (isAlreadyTaken) {
        return false;
      }

      const hasMetPrerequisites = course.prerequisites.every(prereqId =>
        studentCompletedCourseIds.includes(prereqId.toString())
      );
      return hasMetPrerequisites;
    });

    res.status(200).json({
      success: true,
      data: remainingCourses
    });
  } catch (err) {
    next(err);
  }
};