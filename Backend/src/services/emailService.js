const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // Or 'SendGrid', 'Outlook', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendOtpEmail = async (toEmail, otpCode, type = 'verification') => {
  const subject = type === 'verification' ? 'Verify your account' : 'Reset your password';
  const text = `Your OTP code is: ${otpCode}. It is valid for 5 minutes. Please do not share this with anyone.`;

  const mailOptions = {
    from: `"My Chat App" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: subject,
    text: text,
    // You can also add 'html' here for a prettier email template
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP Email sent to ${toEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send email: ${error.message}`);
    throw new Error("Could not send email");
  }
};