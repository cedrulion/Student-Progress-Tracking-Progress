const Institution = require('../models/Institution');
const Student = require('../models/Student');

// Get institution profile
exports.getProfile = async (req, res, next) => {
  console.log('User making request:', req.user);
  try {
    const institution = await Institution.findOne({ userId: req.user.id }).populate('userId');
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }
    
    res.status(200).json({ success: true, data: institution });
  } catch (err) {
    next(err);
  }
};

// Update institution profile
exports.updateProfile = async (req, res, next) => {
  try {
    const institution = await Institution.findOneAndUpdate(
      { userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('userId');
    
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }
    
    res.status(200).json({ success: true, data: institution });
  } catch (err) {
    next(err);
  }
};

// Request student progress
exports.requestStudentProgress = async (req, res, next) => {
  try {
    const { studentId } = req.body;
    
    const institution = await Institution.findOne({ userId: req.user.id });
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }
    
    // Check if institution is verified
    if (institution.verificationStatus !== 'verified') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your institution needs to be verified first' 
      });
    }
    
    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    // Check if request already exists
    const existingRequest = institution.requestedStudents.find(
      req => req.student.toString() === studentId
    );
    
    if (existingRequest) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already requested this student\'s progress' 
      });
    }
    
    institution.requestedStudents.push({ student: studentId });
    await institution.save();
    
    res.status(201).json({ success: true, data: institution });
  } catch (err) {
    next(err);
  }
};

// Get student progress (if approved)
exports.getStudentProgress = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    
    const institution = await Institution.findOne({ userId: req.user.id });
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }
    
    // Find approved request for this student
    const approvedRequest = institution.requestedStudents.find(
      req => req.student.toString() === studentId && req.status === 'approved'
    );
    
    if (!approvedRequest) {
      return res.status(403).json({ 
        success: false, 
        message: 'You don\'t have permission to view this student\'s progress' 
      });
    }
    
    const student = await Student.findById(studentId).select('-transcriptRequests');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.status(200).json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
};

// Get all students
exports.getAllStudents = async (req, res, next) => {
  try {
    const students = await Student.find().select('firstName lastName studentId department program');
    res.status(200).json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
};

// Get institution's requests
exports.getRequests = async (req, res, next) => {
  try {
    const institution = await Institution.findOne({ userId: req.user.id })
      .populate('requestedStudents.student', 'firstName lastName studentId');
    
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }
    
    res.status(200).json({ success: true, data: institution.requestedStudents });
  } catch (err) {
    next(err);
  }
};