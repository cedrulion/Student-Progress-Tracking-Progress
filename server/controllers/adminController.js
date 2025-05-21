const Student = require('../models/Student');
const Institution = require('../models/Institution');
const User = require('../models/User');
const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');

// Verify institution
exports.verifyInstitution = async (req, res, next) => {
  try {
    const { institutionId } = req.params;
    const { status } = req.body;
    
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

// Approve student transcript request
exports.approveTranscriptRequest = async (req, res, next) => {
  try {
    const { studentId, requestId } = req.params;
    const { status } = req.body;
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    const request = student.transcriptRequests.id(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    request.status = status;
    await student.save();
    
    res.status(200).json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
};

// Approve institution's student progress request
exports.approveProgressRequest = async (req, res, next) => {
  try {
    const { institutionId, requestId } = req.params;
    const { status } = req.body;
    
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }
    
    const request = institution.requestedStudents.id(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    request.status = status;
    await institution.save();
    
    res.status(200).json({ success: true, data: institution });
  } catch (err) {
    next(err);
  }
};

// Get all institutions
exports.getAllInstitutions = async (req, res, next) => {
  try {
    const institutions = await Institution.find().populate('userId');
    res.status(200).json({ success: true, data: institutions });
  } catch (err) {
    next(err);
  }
};

// Get all students
exports.getAllStudents = async (req, res, next) => {
  try {
    const students = await Student.find().populate('userId');
    res.status(200).json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
};

// Get student by ID
exports.getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('userId');
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

// Get all pending requests
exports.getPendingRequests = async (req, res, next) => {
  try {
    // Get transcript requests
    const students = await Student.find().populate({
      path: 'transcriptRequests',
      match: { status: 'pending' },
      populate: { path: 'institution' }
    });
    
    const transcriptRequests = [];
    
    students.forEach(student => {
      student.transcriptRequests.forEach(request => {
        if (request.status === 'pending') {
          transcriptRequests.push({
            _id: request._id,
            student: student._id,
            studentName: `${student.firstName} ${student.lastName}`,
            studentId: student.studentId,
            requestDate: request.requestDate,
            purpose: request.purpose,
            institution: request.institution,
            status: request.status
          });
        }
      });
    });
    
    // Get progress requests
    const institutions = await Institution.find()
      .populate({
        path: 'requestedStudents',
        match: { status: 'pending' },
        populate: { 
          path: 'student',
          select: 'firstName lastName studentId program department' // Be explicit about fields
        }
      });
    
    const progressRequests = [];
    
    institutions.forEach(institution => {
      institution.requestedStudents.forEach(request => {
        if (request.status === 'pending' && request.student) {
          progressRequests.push({
            _id: request._id,
            institution: institution._id,
            institutionName: institution.name,
            contactEmail: institution.contactEmail,
            verificationStatus: institution.verificationStatus,
            student: request.student,
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

// Get pending transcript requests
exports.getPendingTranscripts = async (req, res, next) => {
  try {
    const students = await Student.find({ 'transcriptRequests.status': 'pending' })
      .populate('transcriptRequests.institution');
    
    const requests = students.flatMap(student => 
      student.transcriptRequests
        .filter(req => req.status === 'pending')
        .map(req => ({
          ...req.toObject(),
          student: {
            _id: student._id,
            firstName: student.firstName,
            lastName: student.lastName,
            studentId: student.studentId
          }
        }))
    );
    
    res.status(200).json({ success: true, data: requests });
  } catch (err) {
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

exports.getPendingTranscriptsCount = async (req, res, next) => {
  try {
    const count = await Student.countDocuments({ 'transcriptRequests.status': 'pending' });
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
      Student.countDocuments({ 'transcriptRequests.status': 'pending' }),
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
    // Fetch institutions with approved requested students
    const institutions = await Institution.find({
      'requestedStudents.status': 'approved'
    }).populate('requestedStudents.student', 'firstName lastName studentId program department');

    // Map the results to the desired format
    const approvedRequests = institutions.flatMap(institution => 
      institution.requestedStudents
        .filter(student => student.status === 'approved')
        .map(student => ({
          _id: student._id,
          institution: {
            _id: institution._id,
            name: institution.name,
            contactEmail: institution.contactEmail,
            verificationStatus: institution.verificationStatus
          },
          student: {
            _id: student.student._id,
            firstName: student.student.firstName,
            lastName: student.student.lastName,
            studentId: student.student.studentId,
            program: student.student.program,
            department: student.student.department
          },
          requestDate: student.requestDate,
          processedAt: student.processedAt,
          purpose: student.purpose,
          justification: student.justification,
          requestedData: student.requestedData,
          consentForm: student.consentForm,
          status: student.status
        }))
    );

    res.status(200).json({
      success: true,
      data: approvedRequests
    });
  } catch (err) {
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
// Generate transcript PDF
exports.generateTranscript = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id).populate('userId');
    
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
          <h2>${student.institution || 'University Name'}</h2>
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
    next(err);
  }
};

// Request transcript (for students)
exports.requestTranscript = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { purpose, institutionId } = req.body;
    
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    const newRequest = {
      requestDate: new Date(),
      purpose,
      institution: institutionId,
      status: 'pending'
    };
    
    student.transcriptRequests.push(newRequest);
    await student.save();
    
    res.status(201).json({ success: true, data: newRequest });
  } catch (err) {
    next(err);
  }
};

// Get student transcript requests
exports.getStudentTranscriptRequests = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id).populate('transcriptRequests.institution');
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.status(200).json({ success: true, data: student.transcriptRequests });
  } catch (err) {
    next(err);
  }
};