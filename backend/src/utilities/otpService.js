const crypto = require("crypto");
const bcrypt = require("bcrypt");
const redisClient = require("../config/redis");
const transporter = require("../config/nodemailer");

// In-memory fallback map when Redis is offline
const inMemoryOtpStore = new Map();

/**
 * Generate a 6-digit numeric OTP.
 */
function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Send OTP via email with strict 5s timeout and fallback logging.
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
    const sendMailPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Email send timed out (15s)")), 15000)
    );
    const info = await Promise.race([sendMailPromise, timeoutPromise]);
    console.log(`[OTP Service] Verification email successfully sent to ${email}`);
    console.log(`[OTP Service] SMTP Response: ${info.response}`);
    return true;
  } catch (error) {
    console.error(`[OTP Service] Failed to send email to ${email}:`, error.message);
    return false;
  }
}

/**
 * Save OTP to Redis or in-memory store.
 */
async function saveOtp(email, otp) {
  const normalizedEmail = email.toLowerCase().trim();
  const key = `otp:${normalizedEmail}`;
  const hashedOtp = await bcrypt.hash(otp, 10);

  if (redisClient.isOpen) {
    try {
      await redisClient.set(key, hashedOtp, { EX: 600 });
      const attemptsKey = `otp_attempts:${normalizedEmail}`;
      await redisClient.del(attemptsKey);
      return;
    } catch (err) {
      console.error("[OTP Service] Redis error, saving to memory fallback:", err.message);
    }
  }

  // Memory fallback
  inMemoryOtpStore.set(normalizedEmail, {
    hashedOtp,
    expiresAt: Date.now() + 600 * 1000,
    attempts: 0,
  });
}

/**
 * Verify OTP from Redis or in-memory store.
 */
async function verifyOtpValue(email, otp) {
  const normalizedEmail = email.toLowerCase().trim();
  const key = `otp:${normalizedEmail}`;
  const attemptsKey = `otp_attempts:${normalizedEmail}`;

  if (redisClient.isOpen) {
    try {
      const hashedOtp = await redisClient.get(key);
      if (hashedOtp) {
        const isValid = await bcrypt.compare(otp, hashedOtp);
        if (isValid) {
          return true;
        } else {
          const attempts = await redisClient.incr(attemptsKey);
          if (attempts === 1) await redisClient.expire(attemptsKey, 600);
          if (attempts >= 5) {
            await redisClient.del(key);
            await redisClient.del(attemptsKey);
            throw new Error("Too many failed attempts. OTP has been invalidated. Please request a new one.");
          }
          return false;
        }
      }
    } catch (err) {
      if (err.message.includes("Too many failed attempts")) throw err;
      console.error("[OTP Service] Redis error, checking memory fallback:", err.message);
    }
  }

  // Check in-memory store
  const record = inMemoryOtpStore.get(normalizedEmail);
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    inMemoryOtpStore.delete(normalizedEmail);
    return false;
  }

  const isValid = await bcrypt.compare(otp, record.hashedOtp);
  if (isValid) {
    return true;
  } else {
    record.attempts += 1;
    if (record.attempts >= 5) {
      inMemoryOtpStore.delete(normalizedEmail);
      throw new Error("Too many failed attempts. OTP has been invalidated. Please request a new one.");
    }
    return false;
  }
}

/**
 * Delete OTP from Redis and memory store.
 */
async function deleteOtp(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const key = `otp:${normalizedEmail}`;
  const attemptsKey = `otp_attempts:${normalizedEmail}`;
  inMemoryOtpStore.delete(normalizedEmail);

  if (redisClient.isOpen) {
    try {
      await redisClient.del(key);
      await redisClient.del(attemptsKey);
    } catch (err) {
      console.error("[OTP Service] Redis deleteOtp error:", err.message);
    }
  }
}

/**
 * Send Reset Password OTP via email with strict 5s timeout.
 */
async function sendResetPasswordEmail(email, otp) {
  const mailOptions = {
    from: `"Rentora Support" <${process.env.EMAIL_USER || "no-reply@rentora.com"}>`,
    to: email,
    subject: "Rentora Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #1e3a8a; text-align: center; font-size: 24px; margin-bottom: 20px;">Reset Your Password</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Hi,</p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">We received a request to reset the password for your Rentora account. Please use the following 6-digit One-Time Password (OTP) to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2b7fff; background-color: #f3f4f6; padding: 12px 24px; border-radius: 8px; display: inline-block;">${otp}</span>
        </div>
        <p style="color: #dc2626; font-size: 14px; font-weight: 500;">Note: This OTP is valid for 10 minutes. If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">Rentora Security Team</p>
      </div>
    `,
  };

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("SMTP credentials are not configured in environment variables.");
    }
    const sendMailPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Email send timed out (15s)")), 15000)
    );
    const info = await Promise.race([sendMailPromise, timeoutPromise]);
    console.log(`[OTP Service] Password reset email successfully sent to ${email}`);
    console.log(`[OTP Service] SMTP Response: ${info.response}`);
    return true;
  } catch (error) {
    console.error(`[OTP Service] Failed to send email to ${email}:`, error.message);
    return false;
  }
}

module.exports = {
  generateOtp,
  sendOtpEmail,
  sendResetPasswordEmail,
  saveOtp,
  verifyOtpValue,
  deleteOtp,
};
