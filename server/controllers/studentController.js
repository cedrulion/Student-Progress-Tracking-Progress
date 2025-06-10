const { Student, Course } = require('../models/Student');
const Institution = require('../models/Institution'); // Make sure Institution model is correctly imported if needed elsewhere
const pdf = require('html-pdf');

// Define a consistent grade point mapping for GPA calculation
const GRADE_POINTS_5_SCALE = {
    'A': 5,
    'B': 4,
    'C': 3,
    'D': 2,
    'E': 1,
    'F': 0,
    'N/A': 0 // Courses with N/A grade don't contribute to GPA
};

// Define semester order for sorting
const SEMESTER_ORDER = {
    'Fall': 1,
    'Spring': 2,
    'Summer': 3
};

// Get student profile
exports.getProfile = async (req, res, next) => {
    console.log('User making request:', req.user);
    try {
        const student = await Student.findOne({ userId: req.user.id }).populate('userId')
        .populate('courses.course');
        console.log('Found student:', student);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        res.status(200).json({ success: true, data: student });
    } catch (err) {
        console.error('Error in getProfile:', err);
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
        console.error('Error in updateProfile:', err);
        if (err.name === 'ValidationError') {
            const errors = Object.keys(err.errors).map(key => err.errors[key].message).join(', ');
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }
        next(err);
    }
};

// Get student transcript
exports.getStudentTranscript = async (req, res, next) => {
    try {
        // Populate 'course' within the 'courses' array to get course details
        const student = await Student.findOne({ userId: req.user.id })
            .populate('userId')
            .populate({
                path: 'courses.course',
                model: 'Course' // Ensure you explicitly specify the model here
            });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Filter out courses where 'course' might not have been populated (e.g., if course ID is invalid)
        // This also filters out courses where grade is N/A for GPA calculation
        const gradedCourses = student.courses.filter(sc => sc.course && sc.grade !== 'N/A');

        // Sort courses by yearTaken and then by semesterTaken
        const sortedCourses = [...gradedCourses].sort((a, b) => {
            if (a.yearTaken !== b.yearTaken) {
                return a.yearTaken - b.yearTaken;
            }
            // Use the defined semester order for comparison
            return SEMESTER_ORDER[a.semesterTaken] - SEMESTER_ORDER[b.semesterTaken];
        });

        // Calculate GPA using the 5.0 scale from your schema's pre-save hook
        let totalCredits = 0;
        let totalPoints = 0;

        for (const studentCourse of gradedCourses) {
            // Check if course details are populated and valid
            if (studentCourse.course && GRADE_POINTS_5_SCALE[studentCourse.grade] !== undefined) {
                totalCredits += studentCourse.course.credits;
                totalPoints += GRADE_POINTS_5_SCALE[studentCourse.grade] * studentCourse.course.credits;
            }
        }

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
                    // dateOfBirth: student.dateOfBirth, // Removed as it's not in your schema
                },
                courses: sortedCourses.map(sc => ({
                    code: sc.course.code,
                    name: sc.course.name,
                    semester: sc.semesterTaken, // Use semesterTaken from studentCourseSchema
                    yearTaken: sc.yearTaken,
                    credits: sc.course.credits,
                    grade: sc.grade,
                    isRetake: sc.isRetake
                })),
                gpa
            }
        });
    } catch (err) {
        console.error('Error in getStudentTranscript:', err);
        next(err);
    }
};

exports.downloadTranscript = async (req, res, next) => {
    try {
      const student = await Student.findOne({
          userId: req.user.id
        })
        .populate('userId')
        .populate({
          path: 'courses.course',
          model: 'Course' // Ensure you explicitly specify the model here
        });
  
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }
  
      // Populate institution details for the header, if applicable to the student model
      // Assuming student might have an 'institution' field that links to the Institution model
      // If not, you might need to adjust how 'University Name' is displayed.
      let institutionName = 'University Name';
      if (student.institution) {
        // Assuming 'student.institution' is populated or is a direct field
        const institution = await Institution.findById(student.institution);
        if (institution) {
          institutionName = institution.name;
        }
      }
  
  
      // Group courses by sc.course.year first, then sort within years by semester
      const coursesByYear = student.courses.reduce((acc, studentCourse) => {
        // Ensure course data exists and has a year property
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
  
  
      // Calculate GPA using the 5.0 scale
      let totalCredits = 0;
      let totalPoints = 0;
  
      student.courses.forEach(studentCourse => {
        if (studentCourse.course && GRADE_POINTS_5_SCALE[studentCourse.grade] !== undefined) {
          totalCredits += studentCourse.course.credits;
          totalPoints += GRADE_POINTS_5_SCALE[studentCourse.grade] * studentCourse.course.credits;
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
            <h2>${institutionName}</h2>
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
          console.error('Error generating PDF:', err);
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
      console.error('Error in downloadTranscript:', err);
      next(err);
    }
  };
// @desc    Get all courses assigned to the logged-in student (completed/in-progress)
// @route   GET /api/students/my-assigned-courses
// @access  Private (Student)
exports.myAssignedCourses = async (req, res, next) => {
  console.log('User making request to myAssignedCourses:', req.user);
  try {
      const student = await Student.findOne({ userId: req.user.id })
          .populate('courses.course'); // Populate the actual course details

      if (!student) {
          return res.status(404).json({ success: false, message: 'Student not found.' });
      }

      // Return the courses array directly
      res.status(200).json({ success: true, data: student.courses });
  } catch (err) {
      console.error('Error in myAssignedCourses:', err);
      next(err);
  }
};

// @desc    Get courses the logged-in student is eligible to take (remaining courses)
// @route   GET /api/students/my-remaining-courses
// @access  Private (Student)
exports.myRemainingCourses = async (req, res, next) => {
  console.log('User making request to myRemainingCourses:', req.user);
  try {
      const student = await Student.findOne({ userId: req.user.id })
          .populate('courses.course'); // Populate completed courses to check prerequisites

      if (!student) {
          return res.status(404).json({ success: false, message: 'Student not found.' });
      }

      const allCourses = await Course.find(); // Get all available courses

      // Get IDs of courses the student has successfully completed (grade A, B, C, D)
      const studentCompletedCourseIds = student.courses
          .filter(sc => sc.course && ['A', 'B', 'C', 'D'].includes(sc.grade))
          .map(sc => sc.course._id.toString());

      const remainingCourses = allCourses.filter(course => {
          // 1. Check if the student has already taken this course (regardless of grade)
          const isAlreadyTaken = student.courses.some(sc => sc.course && sc.course._id.toString() === course._id.toString());
          if (isAlreadyTaken) {
              return false; // Student has already taken this course, so it's not 'remaining'
          }

          // 2. Check if all prerequisites for this course are met
          // If a course has no prerequisites, it's considered met.
          const hasMetPrerequisites = course.prerequisites.every(prereqId =>
              studentCompletedCourseIds.includes(prereqId.toString())
          );

          return hasMetPrerequisites;
      });

      res.status(200).json({ success: true, data: remainingCourses });
  } catch (err) {
      console.error('Error in myRemainingCourses:', err);
      next(err);
  }
};