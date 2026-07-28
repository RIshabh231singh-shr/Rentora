const express = require("express");
const router = express.Router();
const {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    googleLogin,
    googleRegister,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword
} = require("../controllers/authController");
const tenantAuthMiddleware = require("../middleware/tenantMiddleware");
const slidingWindowRateLimit = require("../middleware/rateLimiter");

// ── Rate limiters (Redis Sliding Window) ──────────────────────────
const strictLimiter = slidingWindowRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    keyPrefix: "rl:auth:strict:",
    message: "Too many authentication attempts. Please wait before trying again.",
});

const otpLimiter = slidingWindowRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    keyPrefix: "rl:auth:otp:",
    message: "Too many OTP requests. Please wait before requesting a new OTP.",
});

const refreshLimiter = slidingWindowRateLimit({
    windowMs: 60 * 1000,
    max: 150,
    keyPrefix: "rl:auth:refresh:",
    message: "Too many token refresh attempts.",
});

router.post("/register", strictLimiter, registerUser);
router.post("/login", strictLimiter, loginUser);
router.post("/logout", logoutUser);
router.post("/refresh", refreshLimiter, refreshAccessToken);
router.post("/verify-otp", otpLimiter, verifyOtp);
router.post("/resend-otp", otpLimiter, resendOtp);
router.post("/forgot-password", strictLimiter, forgotPassword);
router.post("/reset-password", strictLimiter, resetPassword);
router.post("/google-login", strictLimiter, googleLogin);
router.post("/google-register", strictLimiter, googleRegister);
router.patch("/profile", tenantAuthMiddleware, updateProfile);
router.patch("/change-password", tenantAuthMiddleware, changePassword);

module.exports = router;
