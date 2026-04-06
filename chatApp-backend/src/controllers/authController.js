const User = require('../models/User');
const Otp = require('../models/Otp');
const emailService = require('../services/emailService');

// Utility to generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 1. REGISTER (Now sends OTP instead of auto-logging in)
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      if (existingUser.isVerified) return res.status(400).json({ message: "User already exists" });
      // If user exists but isn't verified, we allow them to request a new OTP
    } else {
      await User.create({ name, email, password });
    }

    const otpCode = generateOTP();
    await Otp.create({ email, otp: otpCode });
    await emailService.sendOtpEmail(email, otpCode, 'verification');

    res.status(201).json({ message: "Registration successful. Please check your email for the OTP." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. VERIFY OTP (First-time login)
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) return res.status(400).json({ message: "Invalid or expired OTP" });

    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { returnDocument: 'after' }
    );
    
    // Clean up OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    // Initialize session now that they are verified
    req.session.userId = user._id;

    res.status(200).json({ message: "Email verified successfully", user: { id: user._id, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. NORMAL LOGIN (Added check for isVerified)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email first" });
    }

    req.session.userId = user._id;
    res.status(200).json({ message: "Logged in successfully", user: { id: user._id, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. FORGOT PASSWORD (Send OTP)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otpCode = generateOTP();
    
    // Clear any existing OTPs for this email to prevent spam
    await Otp.deleteMany({ email });
    
    await Otp.create({ email, otp: otpCode });
    await emailService.sendOtpEmail(email, otpCode, 'reset');

    res.status(200).json({ message: "Password reset OTP sent to your email." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) return res.status(400).json({ message: "Invalid or expired OTP" });

    const user = await User.findOne({ email });
    
    // Update password (your pre-save hook in User model will hash this automatically)
    user.password = newPassword;
    await user.save();

    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(200).json({ message: "Password reset successfully. You can now login." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie('connect.sid');
    res.status(200).json({ message: "Logged out" });
  });
};
