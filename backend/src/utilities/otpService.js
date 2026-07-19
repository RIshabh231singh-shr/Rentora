const crypto = require("crypto");
const bcrypt = require("bcrypt");
const redisClient = require("../config/redis");
const transporter = require("../config/nodemailer");

/**
 * Generate a 6-digit numeric OTP.
 */
function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Send OTP via email.
 */
async function sendOtpEmail(email, otp) {
  const mailOptions = {
    from: `"Rentora Support" <${process.env.EMAIL_USER || "no-reply@rentora.com"}>`,
    to: email,
    subject: "Rentora Account Verification OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #1e3a8a; text-align: center; font-size: 24px; margin-bottom: 20px;">Verify Your Rentora Account</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Hi,</p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Thank you for registering with Rentora! To complete your registration and verify your email address, please use the following 6-digit One-Time Password (OTP):</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2b7fff; background-color: #f3f4f6; padding: 12px 24px; border-radius: 8px; display: inline-block;">${otp}</span>
        </div>
        <p style="color: #dc2626; font-size: 14px; font-weight: 500;">Note: This OTP is valid for 10 minutes. Please do not share this OTP with anyone.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">If you did not request this code, please ignore this email.</p>
      </div>
    `,
  };

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("SMTP credentials are not configured in environment variables.");
    }
    await transporter.sendMail(mailOptions);
    console.log(`[OTP Service] Verification email successfully sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`[OTP Service] Failed to send email to ${email}:`, error.message);
    // Log the OTP locally for testing
    console.warn("\\n==================================================");
    console.warn(`[OTP Service] Local Testing Fallback - Email not sent.`);
    console.warn(`Verification OTP for ${email}: ${otp}`);
    console.warn("==================================================\\n");
    return false;
  }
}

/**
 * Save OTP to Redis (Hashed).
 */
async function saveOtp(email, otp) {
  const key = `otp:${email.toLowerCase().trim()}`;
  const hashedOtp = await bcrypt.hash(otp, 10);
  await redisClient.set(key, hashedOtp, { EX: 600 }); // Valid for 10 minutes
  
  // Reset attempts when a new OTP is generated
  const attemptsKey = `otp_attempts:${email.toLowerCase().trim()}`;
  await redisClient.del(attemptsKey);
}

/**
 * Verify OTP from Redis, with Attempt Limit.
 * Returns true if valid, false if invalid, or throws error if locked out.
 */
async function verifyOtpValue(email, otp) {
  const key = `otp:${email.toLowerCase().trim()}`;
  const attemptsKey = `otp_attempts:${email.toLowerCase().trim()}`;
  
  const hashedOtp = await redisClient.get(key);
  if (!hashedOtp) return false;

  const isValid = await bcrypt.compare(otp, hashedOtp);
  if (isValid) {
    return true;
  } else {
    const attempts = await redisClient.incr(attemptsKey);
    // Set expiry for attempts key just in case to match OTP expiry
    if (attempts === 1) await redisClient.expire(attemptsKey, 600);
    
    if (attempts >= 5) {
      await redisClient.del(key);
      await redisClient.del(attemptsKey);
      throw new Error("Too many failed attempts. OTP has been invalidated. Please request a new one.");
    }
    return false;
  }
}

/**
 * Delete OTP from Redis.
 */
async function deleteOtp(email) {
  const key = `otp:${email.toLowerCase().trim()}`;
  const attemptsKey = `otp_attempts:${email.toLowerCase().trim()}`;
  await redisClient.del(key);
  await redisClient.del(attemptsKey);
}

module.exports = {
  generateOtp,
  sendOtpEmail,
  saveOtp,
  verifyOtpValue,
  deleteOtp,
};
