const { Student, Course } = require('../models/Student');
const Institution = require('../models/Institution');
const pdf = require('html-pdf');

// Define grade point mapping for GPA calculation
const GRADE_POINTS_5_SCALE = {
    'A': 5,
    'B': 4,
    'C': 3,
    'D': 2,
    'E': 1,
    'F': 0,
    'N/A': 0
};

// Define semester order for sorting
const SEMESTER_ORDER = {
    'Fall': 1,
    'Spring': 2,
    'Summer': 3,
    'Winter': 4
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
                marks: studentCourse.originalMarks,
                type: 'Original' // Add type to distinguish
            }];

            studentCourse.retakeAttempts.forEach(attempt => {
                allGrades.push({
                    grade: attempt.grade,
                    marks: attempt.marks,
                    type: 'Retake' // Add type
                });
            });

            // Find the best grade (highest marks, or best letter grade if marks are tied)
            let bestGrade = { grade: 'N/A', marks: -1, type: '' };

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

            // For GPA calculation, consider the actual best marks (before PDF display rule)
            let marksToUseForGPA = bestGrade.marks;
            if (bestGrade.type === 'Retake') {
                // If it's a retake and it's the best grade, cap marks at 50 for GPA if needed by policy
                // This part depends on your exact GPA calculation policy.
                // If retakes always count as 50 for GPA regardless of actual retake marks, uncomment and adjust:
                // marksToUseForGPA = Math.min(bestGrade.marks, 50); // Cap at 50
                // For now, GPA calculation uses the actual best marks, not the capped 50 for display
            }


            if (bestGrade.grade !== 'N/A') {
                totalPoints += GRADE_POINTS_5_SCALE[bestGrade.grade] * studentCourse.course.credits;
                totalCredits += studentCourse.course.credits;
            }
        }
    });

    return totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
};

// Get student profile
exports.getProfile = async (req, res, next) => {
    try {
        const student = await Student.findOne({ userId: req.user.id })
            .populate('userId')
            .populate('courses.course');

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
        const student = await Student.findOne({ userId: req.user.id })
            .populate('userId')
            .populate('courses.course');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Calculate GPA based on best attempts
        student.gpa = calculateGPA(student); // <--- This line uses the calculateGPA function

        // Group courses by year
        const coursesByYear = student.courses.reduce((acc, studentCourse) => {
            const year = studentCourse.course?.year || 'N/A';
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

        // Sort courses within each year by semester
        sortedYears.forEach(year => {
            coursesByYear[year].sort((a, b) => {
                const semesterA = a.originalSemesterTaken || 'N/A';
                const semesterB = b.originalSemesterTaken || 'N/A';
                return (SEMESTER_ORDER[semesterA] || 99) - (SEMESTER_ORDER[semesterB] || 99);
            });
        });

        res.status(200).json({
            success: true,
            data: {
                student: {
                    firstName: student.firstName,
                    lastName: student.lastName,
                    studentId: student.studentId,
                    program: student.program,
                    department: student.department,
                    gpa: student.gpa // <--- The calculated GPA is included here
                },
                courses: sortedYears.map(year => ({
                    year,
                    courses: coursesByYear[year].map(sc => {
                        const allGrades = [{
                            grade: sc.originalGrade,
                            marks: sc.originalMarks,
                            type: 'Original'
                        }];

                        sc.retakeAttempts.forEach(attempt => {
                            allGrades.push({
                                grade: attempt.grade,
                                marks: attempt.marks,
                                type: 'Retake'
                            });
                        });

                        let bestGrade = { grade: 'N/A', marks: -1, type: '' };
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

                        // Current marks for display in the JSON response
                        let currentMarks = bestGrade.marks;
                        // if (bestGrade.type === 'Retake') {
                        //     currentMarks = Math.min(bestGrade.marks, 50); // Apply the 50 cap for display if policy dictates
                        // }

                        return {
                            code: sc.course?.code || 'N/A',
                            name: sc.course?.name || 'N/A',
                            semester: sc.originalSemesterTaken,
                            yearTaken: sc.originalYearTaken,
                            credits: sc.course?.credits || 0,
                            originalGrade: sc.originalGrade,
                            originalMarks: sc.originalMarks,
                            retakeAttempts: sc.retakeAttempts.map(attempt => ({
                                grade: attempt.grade,
                                marks: attempt.marks,
                                semesterTaken: attempt.semesterTaken,
                                yearTaken: attempt.yearTaken
                            })),
                            currentBestGrade: bestGrade.grade,
                            currentBestMarks: currentMarks // Adjusted for display if needed
                        };
                    })
                }))
            }
        });
    } catch (err) {
        next(err);
    }
};

// Download transcript as PDF
exports.downloadTranscript = async (req, res, next) => {
    try {
        const student = await Student.findOne({ userId: req.user.id })
            .populate('userId')
            .populate('courses.course');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Calculate GPA based on best attempts
        student.gpa = calculateGPA(student);

        // Calculate total retake attempts
        const retakeCount = student.courses.reduce((count, course) => count + course.retakeAttempts.length, 0);

        // Group courses by year
        const coursesByYear = student.courses.reduce((acc, studentCourse) => {
            const year = studentCourse.course?.year || 'N/A';
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

        // Sort courses within each year by semester
        sortedYears.forEach(year => {
            coursesByYear[year].sort((a, b) => {
                const semesterA = a.originalSemesterTaken || 'N/A';
                const semesterB = b.originalSemesterTaken || 'N/A';
                return (SEMESTER_ORDER[semesterA] || 99) - (SEMESTER_ORDER[semesterB] || 99);
            });
        });

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

            ${retakeCount >= 3 ? `
                <div class="retake-warning">
                    <p><strong>IMPORTANT NOTICE:</strong> This student has accumulated <strong>${retakeCount} retakes</strong>, which exceeds the maximum allowed retakes at the University of Rwanda. Consequently, this student is <strong>no longer eligible to continue their studies</strong> at the University.</p>
                </div>
            ` : ''}

            ${sortedYears.map(year => `
                <div class="course-section">
                    <h3 class="course-year-heading">Academic ${year}</h3>
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
                                        type: 'Original'
                                    }];

                                    studentCourse.retakeAttempts.forEach(attempt => {
                                        allGrades.push({
                                            grade: attempt.grade,
                                            marks: attempt.marks,
                                            type: 'Retake'
                                        });
                                    });

                                    // Find best grade
                                    let bestGrade = { grade: 'N/A', marks: -1, type: '' };

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

                                    // --- MODIFICATION START ---
                                    // If the best grade type is 'Retake', set marks to 50 for display
                                    let displayMarks = bestGrade.marks;
                                    if (bestGrade.type === 'Retake') {
                                        displayMarks = 50;
                                    }
                                    // --- MODIFICATION END ---

                                    return `
                                        <tr ${studentCourse.retakeAttempts.length > 0 ? 'class="retake-row"' : ''}>
                                            <td>${studentCourse.course?.code || 'N/A'}</td>
                                            <td>${studentCourse.course?.name || 'N/A'}</td>
                                            <td class="${studentCourse.originalGrade === 'F' || studentCourse.originalGrade === 'E' ? 'grade-F' : 'grade-pass'}">
                                                ${studentCourse.originalGrade}
                                            </td>
                                            <td>${studentCourse.originalMarks}</td>
                                            <td>
                                                ${studentCourse.retakeAttempts.length > 0 ?
                                                    studentCourse.retakeAttempts.map(attempt =>
                                                        `${attempt.grade} (${attempt.marks}) - ${attempt.semesterTaken} ${attempt.yearTaken}`
                                                    ).join('<br>') : 'None'}
                                            </td>
                                            <td class="${bestGrade.grade === 'F' || bestGrade.grade === 'E' ? 'grade-F' : 'grade-pass'}">
                                                ${bestGrade.grade} (${displayMarks}) - ${bestGrade.type}
                                            </td>
                                            <td>${studentCourse.course?.credits || 'N/A'}</td>
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

// Get all courses assigned to the logged-in student
exports.myAssignedCourses = async (req, res, next) => {
    try {
        const student = await Student.findOne({ userId: req.user.id })
            .populate('courses.course');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        res.status(200).json({
            success: true,
            data: student.courses.map(sc => ({
                ...sc.toObject(),
                course: sc.course,
                originalAttempt: {
                    grade: sc.originalGrade,
                    marks: sc.originalMarks,
                    yearTaken: sc.originalYearTaken,
                    semesterTaken: sc.originalSemesterTaken
                },
                retakeAttempts: sc.retakeAttempts
            }))
        });
    } catch (err) {
        next(err);
    }
};

// Get courses the logged-in student is eligible to take (remaining courses)
exports.myRemainingCourses = async (req, res, next) => {
    try {
        const student = await Student.findOne({ userId: req.user.id })
            .populate('courses.course');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        const allCourses = await Course.find();

        // Get IDs of courses the student has passed (original or retake)
        const studentCompletedCourseIds = student.courses
            .filter(sc => {
                const allGrades = [{ grade: sc.originalGrade }];
                sc.retakeAttempts.forEach(att => allGrades.push({ grade: att.grade }));
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
                const allGrades = [{ grade: studentCourse.originalGrade }];
                studentCourse.retakeAttempts.forEach(att => allGrades.push({ grade: att.grade }));

                return !allGrades.some(g => ['A', 'B', 'C', 'D'].includes(g.grade));
            }

            // If not taken at all, check prerequisites
            const hasMetPrerequisites = course.prerequisites.every(prereqId =>
                studentCompletedCourseIds.includes(prereqId.toString())
            );

            return hasMetPrerequisites;
        });

        res.status(200).json({ success: true, data: remainingCourses });
    } catch (err) {
        next(err);
    }
};