const Student = require('../models/Student');
const Institution = require('../models/Institution');
const pdf = require('html-pdf'); 

// Get student profile
exports.getProfile = async (req, res, next) => {
  console.log('User making request:', req.user);
  try {
    const student = await Student.findOne({ userId: req.user.id }).populate('userId');
    console.log('Found student:', student);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.status(200).json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
};

// Update student profile
exports.updateProfile = async (req, res, next) => {
  try {
    const student = await Student.findOneAndUpdate(
      { userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('userId');
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.status(200).json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
};

// Simplified student transcript controller
exports.getStudentTranscript = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).populate('userId');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Sort courses by year and semester
    const sortedCourses = [...student.courses].sort((a, b) => {
      if (a.yearTaken !== b.yearTaken) return a.yearTaken - b.yearTaken;
      return a.semester - b.semester;
    });

    // Calculate GPA
    const gradePoints = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'E': 0.5, 'F': 0 };
    let totalPoints = 0;
    let totalCredits = 0;
    
    student.courses.forEach(course => {
      totalPoints += gradePoints[course.grade] * course.credits;
      totalCredits += course.credits;
    });
    
    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

    res.status(200).json({ 
      success: true,
      data: {
        student: {
          firstName: student.firstName,
          lastName: student.lastName,
          studentId: student.studentId,
          program: student.program,
          department: student.department,
          dateOfBirth: student.dateOfBirth
        },
        courses: sortedCourses,
        gpa
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.downloadTranscript = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).populate('userId');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Sort courses by year and semester
    const sortedCourses = [...student.courses].sort((a, b) => {
      if (a.yearTaken !== b.yearTaken) return a.yearTaken - b.yearTaken;
      return a.semester - b.semester;
    });

    // Calculate GPA
    const gradePoints = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'E': 0.5, 'F': 0 };
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

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=transcript_${student.studentId}.pdf`,
        'Content-Length': buffer.length
      });
      
     
      res.send(buffer);
    });
  } catch (err) {
    next(err);
  }
};