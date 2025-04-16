const Student = require('../models/Student');
const Institution = require('../models/Institution');

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

// Request transcript
exports.requestTranscript = async (req, res, next) => {
  try {
    const { purpose, institutionId } = req.body;
    
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    // Check if student has unpaid requests older than a year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const unpaidRequests = student.transcriptRequests.filter(request => {
      return request.status === 'pending' && request.requestDate < oneYearAgo;
    });
    
    if (unpaidRequests.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have unpaid transcript requests older than a year. Please pay to proceed.' 
      });
    }
    
    student.transcriptRequests.push({ purpose, institution: institutionId });
    await student.save();
    
    res.status(201).json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
};

// Get transcript requests
exports.getTranscriptRequests = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id })
      .populate('transcriptRequests.institution');
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.status(200).json({ success: true, data: student.transcriptRequests });
  } catch (err) {
    next(err);
  }
};