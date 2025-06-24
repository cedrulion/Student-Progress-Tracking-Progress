const mongoose = require('mongoose');

// Schema for individual retake attempts
const retakeAttemptSchema = new mongoose.Schema({
    marks: {
        type: Number,
        required: true,
        min: 0,
        max: 100 // Assuming marks are out of 100
    },
    grade: {
        type: String,
        enum: ['A', 'B', 'C', 'D', 'E', 'F', 'N/A'],
        default: 'N/A'
    },
    yearTaken: { // The academic year this specific retake was taken
        type: Number,
        required: true
    },
    semesterTaken: { // The semester this specific retake was taken
        type: String,
        required: true
    }
}, { _id: false }); // Do not create a separate _id for these sub-subdocuments

const courseSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true // Added unique constraint for course codes
    },
    name: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true,

    },
    year: {
        type: String, // Changed to String to accommodate 'Year 1', 'Year 2'
        required: true,
        enum: ['Year 1', 'Year 2', 'Year 3', 'Year 4'] // Added enum for years
    },
    credits: {
        type: Number,
        required: true
    },
    prerequisites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }]
});

const studentCourseSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true // A course must be associated
    },
    // Original attempt details
    originalMarks: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    originalGrade: {
        type: String,
        enum: ['A', 'B', 'C', 'D', 'E', 'F', 'N/A'],
        default: 'N/A'
    },
    originalYearTaken: {
        type: Number,
        required: true
    },
    originalSemesterTaken: {
        type: String,
        required: true
    },
    // Array to store all retake attempts for this specific course
    retakeAttempts: [retakeAttemptSchema],
    // 'isRetake' for the studentCourse entry itself will be true if it's a retake entry,
    // but the `retakeAttempts` array within an original entry will track its retakes.
    // For simplicity and clarity based on the request, I've reframed.
    // An entry in `student.courses` represents a specific enrollment.
    // If it's a retake, we'll find the *original* entry and add to its retakeAttempts.
    // This `isRetake` will be used if a course is taken multiple times as separate entries in `student.courses`
    // For the requested logic, we aim to have ONE entry per course in student.courses,
    // and if retaken, its `retakeAttempts` array grows.
    // So, this `isRetake` field will be removed as it's better managed by the presence of `retakeAttempts`.
    // Instead, the `_id` of the `studentCourse` entry will uniquely identify a course enrollment.
});

const studentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    studentId: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    program: {
        type: String,
        required: true
    },
    enrollmentYear: {
        type: Number,
        required: true
    },
    courses: [studentCourseSchema], // Array of studentCourseSchema subdocuments
    gpa: {
        type: Number,
        default: 0
    },
    transcriptRequests: [{
        requestDate: {
            type: Date,
            default: Date.now
        },
        purpose: String,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        institution: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Institution'
        }
    }]
}, {
    timestamps: true
});

studentSchema.pre('save', async function(next) {
    if (this.courses && this.courses.length > 0) {
        const gradePoints = {
            'A': 5, // Assuming a 5.0 scale for GPA calculation
            'B': 4,
            'C': 3,
            'D': 2,
            'E': 1,
            'F': 0,
            'N/A': 0
        };
        let totalCredits = 0;
        let totalPoints = 0;

        for (const studentCourse of this.courses) {
            const courseDetails = await mongoose.model('Course').findById(studentCourse.course);
            if (courseDetails) {
                // Determine the effective grade for GPA calculation
                // Get all grades for this course (original + retakes)
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

                // Find the best grade (highest marks, or best letter grade if marks are tied/unavailable)
                let bestGradeData = {
                    grade: 'N/A',
                    marks: -1
                };

                for (const gd of allGrades) {
                    // Only consider valid grades for GPA
                    if (gd.grade !== 'N/A') {
                        if (gd.marks > bestGradeData.marks) {
                            bestGradeData = gd;
                        } else if (gd.marks === bestGradeData.marks && gradePoints[gd.grade] > gradePoints[bestGradeData.grade]) {
                            // If marks are same, prefer better letter grade
                            bestGradeData = gd;
                        }
                    }
                }

                if (bestGradeData.grade !== 'N/A') {
                    totalCredits += courseDetails.credits;
                    totalPoints += gradePoints[bestGradeData.grade] * courseDetails.credits;
                }
            }
        }

        this.gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0; // Format GPA to 2 decimal places
    }
    next();
});

const Course = mongoose.model('Course', courseSchema);
const Student = mongoose.model('Student', studentSchema);

module.exports = {
    Student,
    Course
};
