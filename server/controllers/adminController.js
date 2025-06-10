// controllers/adminController.js
const { Student, Course } = require('../models/Student');
const Institution = require('../models/Institution');
const User = require('../models/User');
const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    fs.mkdirSync(uploadPath, {
      recursive: true
    });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({
  storage: storage
});

const getUserId = (user) => {
  return user._id || user.id;
};

exports.verifyInstitution = async (req, res, next) => {
  try {
    const {
      institutionId
    } = req.params;
    const {
      status
    } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification status provided.'
      });
    }
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }
    institution.verificationStatus = status;
    await institution.save();

    res.status(200).json({
      success: true,
      data: institution
    });
  } catch (err) {
    next(err);
  }
};

exports.respondToTranscriptRequest = async (req, res, next) => {
  try {
    const {
      institutionId,
      requestId
    } = req.params;
    const {
      status
    } = req.body;
    const files = req.files;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided. Must be "approved" or "rejected".'
      });
    }
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found.'
      });
    }
    const transcriptRequest = institution.transcriptRequests.id(requestId);
    if (!transcriptRequest) {
      return res.status(404).json({
        success: false,
        message: 'Transcript request not found within this institution.'
      });
    }
    if (transcriptRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${transcriptRequest.status}.`
      });
    }
    transcriptRequest.status = status;
    transcriptRequest.processedAt = new Date();

    if (files && files.length > 0) {
      transcriptRequest.supportingDocuments = files.map(file => `/uploads/${file.filename}`);
    }
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

exports.approveProgressRequest = async (req, res, next) => {
  try {
    const {
      institutionId,
      requestId
    } = req.params;
    const {
      status
    } = req.body;
    const files = req.files;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided. Must be "approved" or "rejected".'
      });
    }
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }
    const request = institution.requestedStudents.id(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Progress request not found.'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Progress request is already ${request.status}.`
      });
    }

    request.status = status;
    request.processedAt = new Date();

    if (files && files.length > 0) {
      request.supportingDocuments = files.map(file => `/uploads/${file.filename}`);
    }

    await institution.save();

    res.status(200).json({
      success: true,
      data: institution
    });
  } catch (err) {
    console.error('Error approving progress request:', err);
    next(err);
  }
};

exports.getAllInstitutions = async (req, res, next) => {
  try {
    const institutions = await Institution.find().populate('userId', 'email role');
    res.status(200).json({
      success: true,
      data: institutions
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllStudents = async (req, res, next) => {
  try {
    const students = await Student.find().populate('userId', 'email role');
    res.status(200).json({
      success: true,
      data: students
    });
  } catch (err) {
    next(err);
  }
};

exports.getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('userId', 'email role')
      .populate('courses.course');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    res.status(200).json({
      success: true,
      data: student
    });
  } catch (err) {
    next(err);
  }
};

exports.getStudentCourses = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('courses.course');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    res.status(200).json({
      success: true,
      data: student.courses
    });
  } catch (err) {
    next(err);
  }
};

exports.addCourse = async (req, res, next) => {
  try {
    const {
      code,
      name,
      semester,
      year,
      credits,
      prerequisites
    } = req.body;

    const newCourse = await Course.create({
      code,
      name,
      semester,
      year,
      credits,
      prerequisites
    });

    res.status(201).json({
      success: true,
      data: newCourse
    });
  } catch (err) {
    next(err);
  }
};

// New function to get all courses
exports.getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().populate('prerequisites', 'code name');
    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (err) {
    next(err);
  }
};

// New function to update a course
exports.updateCourse = async (req, res, next) => {
  try {
    const {
      id
    } = req.params;
    const updateData = req.body;

    const course = await Course.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (err) {
    next(err);
  }
};

// New function to delete a course
exports.deleteCourse = async (req, res, next) => {
  try {
    const {
      id
    } = req.params;

    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};


exports.assignCourseToStudent = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const {
            courseId,
            grade,
            marks,
            isRetake,
            yearTaken,
            semesterTaken
        } = req.body;
  
        console.log('Backend received:', { courseId, grade, marks, isRetake, yearTaken, semesterTaken });
        console.log('Type of courseId in backend:', typeof courseId);
        console.log('Type of semesterTaken in backend:', typeof semesterTaken);
  
        const student = await Student.findById(studentId).populate('courses.course'); // Keep populate for prerequisite check
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
  
        // --- Retake Limit Check ---
        const retakeCount = student.courses.filter(sc => sc.isRetake === true).length;
        if (retakeCount >= 3) {
            return res.status(403).json({
                success: false,
                message: 'Student cannot continue; they have 3 or more retakes.'
            });
        }
  
        const courseToAssign = await Course.findById(courseId);
        if (!courseToAssign) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
  
        // --- Prerequisite Check ---
        if (courseToAssign.prerequisites && courseToAssign.prerequisites.length > 0) {
            for (const prereqId of courseToAssign.prerequisites) {
                // Ensure student.courses.course is populated for this check
                const hasPrereq = student.courses.some(
                    sc => sc.course && sc.course._id.toString() === prereqId.toString() && ['A', 'B', 'C', 'D'].includes(sc.grade)
                );
                if (!hasPrereq) {
                    const prereqCourse = await Course.findById(prereqId); // This needs to fetch the course name for the message
                    return res.status(400).json({
                        success: false,
                        message: `Prerequisite course "${prereqCourse ? prereqCourse.name : 'Unknown'}" not completed by student.`
                    });
                }
            }
        }
  
        // --- Duplicate Course Check (Optional, but good practice) ---
        const alreadyAssigned = student.courses.some(sc =>
            sc.course && sc.course._id.toString() === courseId.toString() &&
            sc.yearTaken === yearTaken &&
            sc.semesterTaken === semesterTaken
        );
        if (alreadyAssigned) {
            return res.status(400).json({
                success: false,
                message: 'This course is already assigned to the student for the specified semester and year.'
            });
        }
  
        // --- THE CRITICAL CHANGE HERE ---
        // Get the Student's subdocument schema directly
        const StudentCourse = student.schema.path('courses').caster;
  
        // Create a new instance of the subdocument schema
        const newStudentCourse = new StudentCourse({
            course: courseId, // Mongoose will handle converting this to ObjectId if valid
            grade: grade || 'N/A',
            marks: marks || 0,
            isRetake: isRetake || false,
            yearTaken,
            semesterTaken
        });
  
        console.log('New student course object created as subdocument instance:', newStudentCourse);
  
        student.courses.push(newStudentCourse);
        await student.save();
  
        res.status(201).json({
            success: true,
            message: 'Course assigned successfully', // Added for better response
            data: student.courses // Or just the newStudentCourse if you prefer
        });
  
    } catch (err) {
        // Log the full error object for detailed debugging
        console.error('Error assigning course to student (from catch block):', err);
  
        // Check if it's a Mongoose validation error
        if (err.name === 'ValidationError') {
            const errors = Object.keys(err.errors).map(key => err.errors[key].message).join(', ');
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }
  
        next(err); // Pass other errors to the next middleware
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


exports.deleteStudentCourse = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    student.courses = student.courses.filter(
      studentCourse => studentCourse._id.toString() !== req.params.studentCourseId
    );
    await student.save();

    res.status(200).json({
      success: true,
      data: student.courses
    });
  } catch (err) {
    next(err);
  }
};

exports.getPendingRequests = async (req, res, next) => {
  try {
    const institutionsWithPendingTranscripts = await Institution.find({
      'transcriptRequests.status': 'pending'
    }).populate('transcriptRequests.student', 'firstName lastName studentId program department');
    const transcriptRequests = [];
    institutionsWithPendingTranscripts.forEach(institution => {
      institution.transcriptRequests.forEach(request => {
        if (request.status === 'pending' && request.student) {
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
            justification: request.justification,
            consentForm: request.consentForm,
            supportingDocuments: request.supportingDocuments
          });
        }
      });
    });

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
            consentForm: request.consentForm,
            supportingDocuments: request.supportingDocuments
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

exports.getPendingTranscripts = async (req, res, next) => {
  try {
    const institutions = await Institution.find({
        'transcriptRequests.status': 'pending'
      })
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
        },
        supportingDocuments: req.supportingDocuments
      }))
    );
    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (err) {
    console.error('Error in getPendingTranscripts:', err);
    next(err);
  }
};

exports.getStudentCount = async (req, res, next) => {
  try {
    const count = await Student.countDocuments();
    res.status(200).json({
      success: true,
      count
    });
  } catch (err) {
    next(err);
  }
};
exports.getInstitutionCount = async (req, res, next) => {
  try {
    const count = await Institution.countDocuments();
    res.status(200).json({
      success: true,
      count
    });
  } catch (err) {
    next(err);
  }
};

exports.getPendingTranscriptsCount = async (req, res, next) => {
  try {
    const count = await Institution.countDocuments({
      'transcriptRequests.status': 'pending'
    });
    res.status(200).json({
      success: true,
      count
    });
  } catch (err) {
    next(err);
  }
};
exports.getPendingProgressCount = async (req, res, next) => {
  try {
    const count = await Institution.countDocuments({
      'requestedStudents.status': 'pending'
    });
    res.status(200).json({
      success: true,
      count
    });
  } catch (err) {
    next(err);
  }
};
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [studentsCount, institutionsCount, pendingTranscripts, pendingProgress] = await Promise.all([
      Student.countDocuments(),
      Institution.countDocuments(),
      Institution.countDocuments({
        'transcriptRequests.status': 'pending'
      }),
      Institution.countDocuments({
        'requestedStudents.status': 'pending'
      })
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
        status: request.status,
        supportingDocuments: request.supportingDocuments
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

exports.updateStudentCourse = async (req, res, next) => {
  try {
    const {
      studentId,
      studentCourseId
    } = req.params;
    const updateData = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    const studentCourse = student.courses.id(studentCourseId);
    if (!studentCourse) {
      return res.status(404).json({
        success: false,
        message: 'Student course record not found'
      });
    }

    Object.assign(studentCourse, updateData);
    await student.save();

    res.status(200).json({
      success: true,
      data: studentCourse
    });
  } catch (err) {
    next(err);
  }
};

exports.generateTranscript = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id).populate('userId').populate('courses.course');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

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
      if (a === 'N/A') return 1;
      if (b === 'N/A') return -1;
      return parseInt(a) - parseInt(b);
    });

    const gradePoints = {
      'A': 4, 'B': 3, 'C': 2, 'D': 1, 'E': 0.5, 'F': 0
    };
    let totalPoints = 0;
    let totalCredits = 0;

    student.courses.forEach(studentCourse => {
      if (studentCourse.course && studentCourse.grade !== 'N/A' && gradePoints[studentCourse.grade] !== undefined) {
        totalPoints += gradePoints[studentCourse.grade] * studentCourse.course.credits;
        totalCredits += studentCourse.course.credits;
      }
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 'N/A';

    const retakeCount = student.courses.filter(course => course.isRetake).length;

    let retakeWarning = '';
    if (retakeCount >= 3) {
      retakeWarning = `
        <div class="retake-warning">
          <p><strong>IMPORTANT NOTICE:</strong> This student has accumulated <strong>${retakeCount} retakes</strong>, which exceeds the maximum allowed retakes at the University of Rwanda. Consequently, this student is <strong>no longer eligible to continue their studies</strong> at the University.</p>
        </div>
      `;
    }

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
            <h3 class="course-year-heading">Academic ${year}</h3>
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

    const options = {
      format: 'Letter',
      border: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    };

    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        console.error('PDF generation error:', err);
        return next(err);
      }

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=transcript_${student.studentId}.pdf`,
        'Content-Length': buffer.length
      });

      res.send(buffer);
    });
  } catch (err) {
    console.error('Error generating transcript:', err);
    next(err);
  }
};


exports.requestTranscript = async (req, res, next) => {
  try {
    const {
      id
    } = req.params;
    const {
      purpose,
      institutionId
    } = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Target institution not found for request.'
      });
    }

    const existingRequest = institution.transcriptRequests.find(
      req => req.student.toString() === student._id.toString() && req.status === 'pending'
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'A pending transcript request to this institution already exists for this student.'
      });
    }

    const newRequest = {
      requestDate: new Date(),
      purpose,
      student: student._id,
      status: 'pending'
    };
    institution.transcriptRequests.push(newRequest);
    await institution.save();
    res.status(201).json({
      success: true,
      message: 'Transcript request sent to institution.',
      data: newRequest
    });
  } catch (err) {
    console.error('Error in requestTranscript (admin acting):', err);
    next(err);
  }
};

exports.getStudentTranscriptRequests = async (req, res, next) => {
  try {
    const {
      id
    } = req.params;
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    const institutionsWithStudentRequests = await Institution.find({
      'transcriptRequests.student': id
    }).populate('transcriptRequests.student', 'firstName lastName studentId');

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
            status: req.status,
            supportingDocuments: req.supportingDocuments
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      data: studentRelatedRequests
    });
  } catch (err) {
    console.error('Error in getStudentTranscriptRequests (admin looking up student requests):', err);
    next(err);
  }
};

exports.getApprovedTranscripts = async (req, res, next) => {
  try {
    const institutions = await Institution.find({
        'transcriptRequests.status': 'approved'
      })
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
          verificationStatus: institution.verificationStatus
        },
        student: {
          _id: req.student._id,
          firstName: req.student.firstName,
          lastName: req.student.lastName,
          studentId: req.student.studentId,
          program: req.student.program,
          department: req.student.department
        },
        supportingDocuments: req.supportingDocuments
      }))
    );

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (err) {
    console.error('Error in getApprovedTranscripts:', err);
    next(err);
  }
};

exports.upload = upload;