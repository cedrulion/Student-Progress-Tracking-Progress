const User = require('../models/User');

const initAdmin = async () => {
  const email = 'admin@ur.com';
  const password = 'password'; // Use a strong password in production
  const role = 'admin';

  try {
    const existingAdmin = await User.findOne({ email });

    if (!existingAdmin) {
      const newAdmin = new User({
        email,
        password,
        role,
        isVerified: true, // Admin can be auto-verified
      });

      await newAdmin.save();
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
  } catch (err) {
    console.error('❌ Error creating admin user:', err.message);
  }
};

module.exports = initAdmin;
