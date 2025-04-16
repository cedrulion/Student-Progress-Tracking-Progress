const Student = require('../models/Student');
const Institution = require('../models/Institution');
const User = require('../models/User');

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
    const [students, institutions] = await Promise.all([
      Student.find({ 'transcriptRequests.status': 'pending' }).populate('transcriptRequests.institution'),
      Institution.find({ 'requestedStudents.status': 'pending' }).populate('requestedStudents.student')
    ]);
    
    res.status(200).json({ 
      success: true, 
      data: {
        transcriptRequests: students.flatMap(s => 
          s.transcriptRequests.filter(r => r.status === 'pending').map(r => ({
            ...r.toObject(),
            student: s._id,
            studentName: `${s.firstName} ${s.lastName}`,
            studentId: s.studentId
          }))
        ),
        progressRequests: institutions.flatMap(i => 
          i.requestedStudents.filter(r => r.status === 'pending').map(r => ({
            ...r.toObject(),
            institution: i._id,
            institutionName: i.name,
            student: r.student._id,
            studentName: `${r.student.firstName} ${r.student.lastName}`
          }))
        )
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get dashboard statistics
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