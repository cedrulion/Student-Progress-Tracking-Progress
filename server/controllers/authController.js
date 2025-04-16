const User = require('../models/User');
const Student = require('../models/Student');
const Institution = require('../models/Institution');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { sendEmail } = require('../utils/email');
const crypto = require('crypto');

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE
  });
};

// Register a new user
exports.register = async (req, res, next) => {
  try {
    const { email, password, role, ...profileData } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    
    // Create user
    const user = await User.create({ email, password, role });
    
    // Create profile based on role
    if (role === 'student') {
      await Student.create({ userId: user._id, ...profileData });
    } else if (role === 'institution') {
      await Institution.create({ userId: user._id, ...profileData });
    }
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();
    
    // Send verification email
    const verificationUrl = `${config.CLIENT_URL}/verify-email?token=${verificationToken}`;
    await sendEmail({
      email: user.email,
      subject: 'Verify Your Email',
      message: `Please click on the following link to verify your email: ${verificationUrl}`
    });
    
    // Generate token
    const token = generateToken(user._id, user.role);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    next(err);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = generateToken(user._id, user.role);
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    next(err);
  }
};

// Verify email
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid token' });
    }
    
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    
    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
};

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    
    // Send reset email
    const resetUrl = `${config.CLIENT_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message: `You requested a password reset. Please click on the following link to reset your password: ${resetUrl}`
    });
    
    res.status(200).json({ success: true, message: 'Password reset email sent' });
  } catch (err) {
    next(err);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
};

// Get current user
exports.getMe = async (req, res, next) => {
  try {
    let user;
    
    if (req.user.role === 'student') {
      user = await Student.findOne({ userId: req.user.id }).populate('userId');
    } else if (req.user.role === 'institution') {
      user = await Institution.findOne({ userId: req.user.id }).populate('userId');
    } else if (req.user.role === 'admin') {
      user = await User.findById(req.user.id);
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};