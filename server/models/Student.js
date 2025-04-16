const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E', 'F'],
    required: true
  },
  credits: {
    type: Number,
    required: true
  },
  isRetake: {
    type: Boolean,
    default: false
  },
  yearTaken: {
    type: Number,
    required: true
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
  courses: [courseSchema],
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

// Calculate GPA before saving
studentSchema.pre('save', function(next) {
  if (this.courses && this.courses.length > 0) {
    const gradePoints = {
      'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0
    };
    
    let totalCredits = 0;
    let totalPoints = 0;
    
    this.courses.forEach(course => {
      totalCredits += course.credits;
      totalPoints += gradePoints[course.grade] * course.credits;
    });
    
    this.gpa = totalPoints / totalCredits;
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);