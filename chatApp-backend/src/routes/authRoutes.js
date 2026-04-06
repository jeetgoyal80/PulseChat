const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Standard Auth
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// OTP Verification & Password Recovery
router.post('/verify-email', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;