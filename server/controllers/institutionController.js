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

// Helper function to calculate GPA based on best attempts
const calculateGPA = (student) => {
  let totalPoints = 0;
  let totalCredits = 0;

  student.courses.forEach(studentCourse => {
    if (studentCourse.course) {
      // Get all grades (original + retakes)
      const allGrades = [{
        grade: studentCourse.originalGrade,
        marks: studentCourse.originalMarks
      }];

      studentCourse.retakeAttempts.forEach(attempt => {
        allGrades.push({
          grade: attempt.grade,
          marks: attempt.marks
        });
      });

      // Find the best grade (highest marks, or best letter grade if marks are tied)
      let bestGrade = {
        grade: 'N/A',
        marks: -1
      };

      allGrades.forEach(g => {
        if (g.grade !== 'N/A') {
          if (g.marks > bestGrade.marks) {
            bestGrade = g;
          } else if (g.marks === bestGrade.marks &&
            GRADE_POINTS_5_SCALE[g.grade] > GRADE_POINTS_5_SCALE[bestGrade.grade]) {
            bestGrade = g;
          }
        }
      });

      if (bestGrade.grade !== 'N/A') {
        totalPoints += GRADE_POINTS_5_SCALE[bestGrade.grade] * studentCourse.course.credits;
        totalCredits += studentCourse.course.credits;
      }
    }
  });

  return totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
};

// Get institution profile
exports.getProfile = async (req, res, next) => {
  try {
    const userId = getUserId(req.user);
    const institution = await Institution.findOne({
      userId: userId
    }).populate('userId');
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    res.status(200).json({
      success: true,
      data: institution
    });
  } catch (err) {
    next(err);
  }
};

// Update institution profile
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = getUserId(req.user);
    const institution = await Institution.findOneAndUpdate({
      userId: userId
    },
      req.body, {
      new: true,
      runValidators: true
    }
    ).populate('userId');

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    res.status(200).json({
      success: true,
      data: institution
    });
  } catch (err) {
    next(err);
  }
};

// Request student progress
exports.requestStudentProgress = async (req, res, next) => {
  try {
    const {
      studentId
    } = req.params;
    const userId = getUserId(req.user);

    const institution = await Institution.findOne({
      userId: userId
    });
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    if (institution.verificationStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        message: 'Your institution needs to be verified first'
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const existingRequest = institution.requestedStudents.find(
      req => req.student.toString() === studentId
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You have already requested this student\'s progress'
      });
    }

    const newRequest = {
      student: studentId,
      purpose: req.body.purpose,
      justification: req.body.justification,
      requestedData: Array.isArray(req.body.requestedData) ?
        req.body.requestedData :
        [req.body.requestedData].filter(Boolean)
    };

    if (req.file) {
      newRequest.consentForm = req.file.path;
    }

    institution.requestedStudents.push(newRequest);
    await institution.save();

    res.status(201).json({
      success: true,
      data: institution
    });
  } catch (err) {
    next(err);
  }
};

// Get student progress (if approved)
exports.getStudentProgress = async (req, res, next) => {
  try {
    const {
      studentId
    } = req.params;
    const userId = getUserId(req.user);

    const institution = await Institution.findOne({
      userId: userId
    });
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    const approvedRequest = institution.requestedStudents.find(
      req => req.student.toString() === studentId && req.status === 'approved'
    );

    if (!approvedRequest) {
      return res.status(403).json({
        success: false,
        message: 'You don\'t have permission to view this student\'s progress'
      });
    }

    const student = await Student.findById(studentId)
      .select('-transcriptRequests')
      .populate('courses.course');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Calculate GPA based on best attempts
    student.gpa = calculateGPA(student);

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (err) {
    next(err);
  }
};

// Get all students
exports.getAllStudents = async (req, res, next) => {
  try {
    const students = await Student.find().select('firstName lastName studentId department program');
    res.status(200).json({
      success: true,
      data: students
    });
  } catch (err) {
    next(err);
  }
};

// Get institution's requests
exports.getRequests = async (req, res, next) => {
  try {
    const userId = getUserId(req.user);
    const institution = await Institution.findOne({
      userId: userId
    })
      .populate('requestedStudents.student', 'firstName lastName studentId department program');

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    res.status(200).json({
      success: true,
      data: institution.requestedStudents
    });
  } catch (err) {
    next(err);
  }
};

exports.requestStudentTranscript = async (req, res, next) => {
  try {
    const {
      studentId
    } = req.params;
    const {
      purpose,
      justification
    } = req.body;

    const userId = getUserId(req.user);
    const institution = await Institution.findOne({
      userId: userId
    });

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    if (institution.verificationStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        message: 'Your institution needs to be verified first to request transcripts.'
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

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

    if (req.file) {
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

exports.getInstitutionTranscriptRequests = async (req, res, next) => {
  try {
    const userId = getUserId(req.user);
    const institution = await Institution.findOne({
      userId: userId
    })
      .populate('transcriptRequests.student', 'firstName lastName studentId program department');

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    res.status(200).json({
      success: true,
      data: institution.transcriptRequests
    });
  } catch (err) {
    next(err);
  }
};

exports.downloadApprovedStudentTranscript = async (req, res, next) => {
  try {
    const {
      studentId
    } = req.params;
    const userId = getUserId(req.user);

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

    const approvedRequest = institution.transcriptRequests.find(
      reqItem => reqItem.student && reqItem.student._id.toString() === studentId && reqItem.status === 'approved'
    );

    if (!approvedRequest) {
      return res.status(403).json({
        success: false,
        message: 'You do not have an approved transcript request for this student or the request is not yet approved.'
      });
    }

    const student = await Student.findById(studentId).populate('courses.course');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student data not available in the approved request.'
      });
    }

    // Calculate GPA based on best attempts
    student.gpa = calculateGPA(student);

    // Group courses by year
    const coursesByYear = student.courses.reduce((acc, studentCourse) => {
      const year = studentCourse.course && studentCourse.course.year ? studentCourse.course.year.toString() : 'N/A';
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(studentCourse);
      return acc;
    }, {});

    const sortedYears = Object.keys(coursesByYear).sort((a, b) => {
      if (a === 'N/A') return 1;
      if (b === 'N/A') return -1;
      return parseInt(a) - parseInt(b);
    });

    // Calculate total retake attempts
    const retakeCount = student.courses.reduce((count, course) => count + course.retakeAttempts.length, 0);

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
          .retake-row { background-color: #ffebee; }
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
          <h3>Requested by ${institution.name}</h3>
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
              <td><strong>Total Retakes:</strong></td>
              <td>${retakeCount}</td>
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
                    <th>Original Grade</th>
                    <th>Original Marks</th>
                    <th>Retake Attempts</th>
                    <th>Current Marks</th>
                    <th>Credits</th>
                  </tr>
                </thead>
                <tbody>
                  ${coursesByYear[year].map(studentCourse => {
                    // Get all grades (original + retakes)
                    const allGrades = [{
                      grade: studentCourse.originalGrade,
                      marks: studentCourse.originalMarks,
                      type: 'Original',
                      yearTaken: studentCourse.originalYearTaken,
                      semesterTaken: studentCourse.originalSemesterTaken
                    }];

                    studentCourse.retakeAttempts.forEach(att => {
                      allGrades.push({
                        grade: att.grade,
                        marks: att.marks,
                        type: 'Retake',
                        yearTaken: att.yearTaken,
                        semesterTaken: att.semesterTaken
                      });
                    });

                    // Find best grade for display (applying 50 cap for retakes)
                    let bestGradeForDisplay = {
                      grade: 'N/A',
                      marks: -1,
                      type: ''
                    };

                    allGrades.forEach(g => {
                      if (g.grade !== 'N/A') {
                        if (g.marks > bestGradeForDisplay.marks) {
                          bestGradeForDisplay = { ...g
                          }; // Copy object to avoid modifying original
                        } else if (g.marks === bestGradeForDisplay.marks &&
                          GRADE_POINTS_5_SCALE[g.grade] > GRADE_POINTS_5_SCALE[bestGradeForDisplay.grade]) {
                          bestGradeForDisplay = { ...g
                          };
                        }
                      }
                    });

                    // Apply the "50 for retake" logic for display purposes
                    let displayedMarks = bestGradeForDisplay.marks;
                    if (bestGradeForDisplay.type === 'Retake' && bestGradeForDisplay.marks > 50) {
                      displayedMarks = 50;
                    }

                    const hasRetakes = studentCourse.retakeAttempts.length > 0;

                    return `
                      <tr class="${hasRetakes ? 'retake-row' : ''}">
                        <td>${studentCourse.course ? studentCourse.course.code : 'N/A'}</td>
                        <td>${studentCourse.course ? studentCourse.course.name : 'N/A'}</td>
                        <td class="${studentCourse.originalGrade === 'F' || studentCourse.originalGrade === 'E' ? 'grade-F' : 'grade-pass'}">
                          ${studentCourse.originalGrade}
                        </td>
                        <td>${studentCourse.originalMarks}</td>
                        <td>
                          ${studentCourse.retakeAttempts.length > 0 ?
                            studentCourse.retakeAttempts.map((attempt, i) =>
                              `<div>${attempt.grade} (${attempt.marks}) - ${attempt.semesterTaken} ${attempt.yearTaken}</div>`
                            ).join('') : 'None'}
                        </td>
                        <td class="${bestGradeForDisplay.grade === 'F' || bestGradeForDisplay.grade === 'E' ? 'grade-F' : 'grade-pass'}">
                          ${bestGradeForDisplay.grade} (${displayedMarks})
                        </td>
                        <td>${studentCourse.course ? studentCourse.course.credits : 'N/A'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `).join('')}

        <div class="gpa-section">
          <p>Cumulative GPA: ${student.gpa.toFixed(2)}</p>
        </div>

        <div class="footer">
          <p>This is an official document. Any alteration makes it invalid.</p>
          <p>Registrar's Signature: _________________________</p>
        </div>
      </body>
      </html>
    `;

    const options = {
      format: 'Letter',
      border: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
    };

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

      res.send(buffer);
    });

  } catch (err) {
    console.error('Error in downloadApprovedStudentTranscript:', err);
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

    // Get IDs of courses the student has passed (original or retake)
    const studentCompletedCourseIds = student.courses
      .filter(sc => {
        const allGrades = [{
          grade: sc.originalGrade
        }];
        sc.retakeAttempts.forEach(att => allGrades.push({
          grade: att.grade
        }));
        return allGrades.some(g => ['A', 'B', 'C', 'D'].includes(g.grade));
      })
      .map(sc => sc.course._id.toString());

    const remainingCourses = allCourses.filter(course => {
      // Check if student has already taken this course (regardless of passing)
      const hasTakenCourse = student.courses.some(sc =>
        sc.course._id.toString() === course._id.toString()
      );

      // If taken but not passed, it's still remaining (can retake)
      if (hasTakenCourse) {
        const studentCourse = student.courses.find(sc =>
          sc.course._id.toString() === course._id.toString()
        );

        // Check if any attempt (original or retake) was passing
        const allGrades = [{
          grade: studentCourse.originalGrade
        }];
        studentCourse.retakeAttempts.forEach(att => allGrades.push({
          grade: att.grade
        }));

        return !allGrades.some(g => ['A', 'B', 'C', 'D'].includes(g.grade));
      }

      // If not taken at all, check prerequisites
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