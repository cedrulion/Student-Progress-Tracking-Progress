const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String,
    required: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  website: {
    type: String
  },
  institutionType: {
    type: String,
    enum: ['university', 'college', 'school', 'employer', 'government', 'other'],
  },
  description: {
    type: String
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationDocuments: [String],
  requestedStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    requestDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    purpose: {
      type: String,
    },
    justification: {
      type: String,
    },
    requestedData: [{
      type: String,
      enum: ['academic_records'],
    }],
    consentForm: {
      type: String
    },

    supportingDocuments: [String]
  }],

  transcriptRequests: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    requestDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    purpose: {
      type: String,
      required: true
    },
    justification: {
      type: String,
      required: true
    },
    consentForm: {
      type: String
    },

    supportingDocuments: [String] 
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Institution', institutionSchema);