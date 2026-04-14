const User = require('../models/User');
const Otp = require('../models/Otp');
const emailService = require('../services/emailService');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  bio: user.bio,
  privacy: user.privacy,
  blockedUsers: user.blockedUsers,
  isOnline: user.isOnline,
  lastSeen: user.lastSeen,
  isAI: user.isAI
});

const issueOtp = async (email, type) => {
  await Otp.deleteMany({ email });
  const otpCode = generateOTP();
  await Otp.create({ email, otp: otpCode });
  await emailService.sendOtpEmail(email, otpCode, type);
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser?.isVerified) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (!existingUser) {
      await User.create({ name, email, password });
    }

    await issueOtp(email, 'verification');

    res.status(201).json({
      message: 'Registration successful. Please check your email for the OTP.',
      email,
      nextStep: 'verify-email'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resendVerificationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    await issueOtp(email, 'verification');

    res.status(200).json({
      message: 'A new verification OTP has been sent.',
      email
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await Otp.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { returnDocument: 'after' }
    );

    await Otp.deleteMany({ email });

    req.session.userId = user._id;

    res.status(200).json({ message: 'Email verified successfully', user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email first',
        email,
        nextStep: 'verify-email'
      });
    }

    req.session.userId = user._id;
    res.status(200).json({ message: 'Logged in successfully', user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await issueOtp(email, 'reset');

    res.status(200).json({ message: 'Password reset OTP sent to your email.', email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const otpRecord = await Otp.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    user.password = newPassword;
    await user.save();

    await Otp.deleteMany({ email });

    res.status(200).json({ message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }

    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logged out' });
  });
};

exports.getSessionUser = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized. Please login.' });
    }

    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: 'Unauthorized. Please login.' });
    }

    res.status(200).json({ user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
