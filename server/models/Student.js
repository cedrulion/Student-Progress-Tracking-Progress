const mongoose = require('mongoose');

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
    enum: ['Fall', 'Spring', 'Summer'] // Added enum for semesters
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
    
  },
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E', 'F', 'N/A'],
    default: 'N/A'
  },
  marks: {
    type: Number,
    default: 0
  },
  isRetake: {
    type: Boolean,
    default: false
  },
  yearTaken: { // This refers to the actual academic year (e.g., 2023)
    type: Number,
    required: true
  },
  semesterTaken: { // This refers to the actual semester (e.g., Fall, Spring)
    type: String,
   
    enum: ['Fall', 'Spring', 'Summer']
  }
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
  courses: [studentCourseSchema],
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
      if (courseDetails && studentCourse.grade !== 'N/A') {
        totalCredits += courseDetails.credits;
        totalPoints += gradePoints[studentCourse.grade] * courseDetails.credits;
      }
    }

    this.gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  }
  next();
});

const Course = mongoose.model('Course', courseSchema);
const Student = mongoose.model('Student', studentSchema);

module.exports = { Student, Course };