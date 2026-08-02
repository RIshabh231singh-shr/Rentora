const User = require("../models/user");
const validateUser = require("../utilities/validatorUser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");
const env = require("../config/env");
const { generateOtp, sendOtpEmail, saveOtp, verifyOtpValue, deleteOtp, sendResetPasswordEmail } = require("../utilities/otpService");
const { verifyGoogleToken, blacklistTokens, generateTokens, setTokenCookies, clearTokenCookies } = require("../services/authService");

const registerUser = async (req, res) => {
    try {
        validateUser(req.body);
        
        const { email } = req.body;
        
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            if (existingUser.isVerified) {
                throw new Error("Email already exists");
            }
            // Update unverified user details
            existingUser.firstname = req.body.firstname;
            if (req.body.lastname) existingUser.lastname = req.body.lastname;
            existingUser.password = await bcrypt.hash(req.body.password, 10);
            existingUser.phoneNumber = req.body.phoneNumber;
            existingUser.role = req.body.role || "tenant";
            await existingUser.save();
            
            const otp = generateOtp();
            await saveOtp(email, otp);
            const emailSent = await sendOtpEmail(email, otp);
            if (!emailSent) {
                throw new Error("Failed to send verification OTP email. Please check server SMTP configuration or try again later.");
            }
            
            return res.status(200).json({
                requiresVerification: true,
                email: email,
                message: "Account already exists but is unverified. A new verification OTP has been sent."
            });
        }
        
        req.body.password = await bcrypt.hash(req.body.password, 10);
        req.body.role = req.body.role || "tenant";
        req.body.isVerified = false;
        await User.create(req.body);

        const otp = generateOtp();
        await saveOtp(email, otp);
        const emailSent = await sendOtpEmail(email, otp);
        if (!emailSent) {
            throw new Error("Failed to send verification OTP email. Please check server SMTP configuration or try again later.");
        }

        return res.status(201).json({
            requiresVerification: true,
            email: email,
            message: "User registered successfully. Verification OTP sent to your email."
        });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Email already exists" });
        }
        return res.status(400).json({ message: err.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new Error("Email and password are required");
        }

        const user = await User.findOne({ email });
        if (!user) {
            throw new Error("Invalid Credentials");
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid Credentials");
        }
        
        if (!user.isVerified) {
            const otp = generateOtp();
            await saveOtp(email, otp);
            const emailSent = await sendOtpEmail(email, otp);
            if (!emailSent) {
                throw new Error("Failed to send verification OTP email. Please check server SMTP configuration or try again later.");
            }
            return res.status(403).json({
                requiresVerification: true,
                email: user.email,
                message: "Account not verified. A new verification OTP has been sent."
            });
        }
        
        const payload = {
            id: user._id,
            email: user.email,
            role: user.role
        };

        await blacklistTokens(req);

        const { accessToken, refreshToken } = generateTokens(payload);
        setTokenCookies(res, accessToken, refreshToken);

        const userData = {
            id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            isVerified: user.isVerified,
            profilePicture: user.profilePicture || null
        };
        return res.status(200).json({ userData, message: "User logged in successfully" });
        
    } catch (err) {
        return res.status(401).json({ message: err.message });
    }
};

const logoutUser = async (req, res) => {
    try {
        await blacklistTokens(req);
        clearTokenCookies(res);

        return res.status(200).json({
            message: "User logged out successfully"
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token missing"
            });
        }

        if (redisClient.isOpen) {
            const isBlacklisted = await redisClient.exists(`blacklist:${refreshToken}`);
            if (isBlacklisted) {
                return res.status(401).json({
                    message: "Refresh token is blacklisted"
                });
            }
        }

        const decoded = jwt.verify(
            refreshToken,
            env.jwtRefreshSecret
        );
        const accessToken = jwt.sign(
            {
                id: decoded.id,
                role: decoded.role,
                email: decoded.email
            },
            env.jwtAccessSecret,
            {
                expiresIn: "15m"
            }
        );
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 15 * 60 * 1000
        });
        return res.status(200).json({
            message: "Access token refreshed"
        });

    } catch (err) {
        return res.status(401).json({
            message: "Invalid refresh token"
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            data: user
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const isValid = await verifyOtpValue(email, otp);
        if (!isValid) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.isVerified = true;
        await user.save();
        await deleteOtp(email);
        await blacklistTokens(req);

        const payload = {
            id: user._id,
            email: user.email,
            role: user.role,
        };

        const { accessToken, refreshToken } = generateTokens(payload);
        setTokenCookies(res, accessToken, refreshToken);

        const userData = {
            id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            isVerified: user.isVerified,
            profilePicture: user.profilePicture || null,
        };

        return res.status(200).json({
            userData,
            message: "Email verified and logged in successfully",
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "Email is already verified" });
        }

        const cooldownKey = `otp_cooldown:${email.toLowerCase().trim()}`;
        if (redisClient.isOpen) {
            try {
                const isOnCooldown = await redisClient.get(cooldownKey);
                if (isOnCooldown) {
                    return res.status(429).json({ message: "Please wait 60 seconds before requesting a new OTP." });
                }
            } catch (err) {
                console.error("[AuthController] Redis cooldown get error:", err.message);
            }
        }

        const otp = generateOtp();
        await saveOtp(email, otp);
        await sendOtpEmail(email, otp);
        if (redisClient.isOpen) {
            try {
                await redisClient.set(cooldownKey, "active", { EX: 60 });
            } catch (err) {
                console.error("[AuthController] Redis cooldown set error:", err.message);
            }
        }

        return res.status(200).json({
            message: "Verification OTP resent successfully",
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ message: "Google credential is required" });
        }

        const payload = await verifyGoogleToken(credential);
        const { sub: googleId, email, given_name: firstname, family_name: lastname, picture: profilePicture } = payload;

        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (user) {
            let isChanged = false;
            if (!user.googleId) {
                user.googleId = googleId;
                isChanged = true;
            }
            if (profilePicture && !user.profilePicture) {
                user.profilePicture = profilePicture;
                isChanged = true;
            }
            if (!user.isVerified) {
                user.isVerified = true;
                isChanged = true;
            }
            if (isChanged) {
                await user.save();
            }

            const jwtPayload = {
                id: user._id,
                email: user.email,
                role: user.role,
            };

            const { accessToken, refreshToken } = generateTokens(jwtPayload);
            setTokenCookies(res, accessToken, refreshToken);

            const userData = {
                id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                isVerified: user.isVerified,
                profilePicture: user.profilePicture || null,
            };

            return res.status(200).json({
                userData,
                message: "User logged in successfully with Google",
            });
        } else {
            return res.status(200).json({
                isNewGoogleUser: true,
                googleData: {
                    googleId,
                    email,
                    firstname,
                    lastname,
                    profilePicture,
                },
                message: "Registration required to complete Google sign-in",
            });
        }
    } catch (err) {
        console.error("Google login error:", err);
        return res.status(400).json({ message: err.message || "Google authentication failed" });
    }
};

const googleRegister = async (req, res) => {
    try {
        const { credential, phoneNumber, role } = req.body;
        if (!credential || !phoneNumber || !role) {
            return res.status(400).json({ message: "Google credential, phone number, and role are required" });
        }

        if (!["tenant", "landlord", "admin"].includes(role)) {
            return res.status(400).json({ message: "Invalid role selected" });
        }

        const validator = require("validator");
        if (!validator.isMobilePhone(phoneNumber, "en-IN") || phoneNumber.length !== 10) {
            return res.status(400).json({ message: "Invalid 10-digit Indian phone number" });
        }

        const payload = await verifyGoogleToken(credential);
        const { sub: googleId, email, given_name: firstname, family_name: lastname, picture: profilePicture } = payload;

        let user = await User.findOne({ $or: [{ googleId }, { email }] });
        if (user) {
            return res.status(400).json({ message: "User already exists. Please login instead." });
        }

        user = await User.create({
            firstname,
            lastname,
            email,
            phoneNumber,
            role,
            googleId,
            profilePicture,
            isVerified: true,
        });

        const jwtPayload = {
            id: user._id,
            email: user.email,
            role: user.role,
        };

        const { accessToken, refreshToken } = generateTokens(jwtPayload);
        setTokenCookies(res, accessToken, refreshToken);

        const userData = {
            id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            isVerified: user.isVerified,
            profilePicture: user.profilePicture || null,
        };

        return res.status(201).json({
            userData,
            message: "User registered and logged in successfully with Google",
        });
    } catch (err) {
        console.error("Google registration error:", err);
        return res.status(400).json({ message: err.message || "Google registration failed" });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const cooldownKey = `otp_cooldown:${email.toLowerCase().trim()}`;
        const isOnCooldown = await redisClient.get(cooldownKey);
        if (isOnCooldown) {
            return res.status(429).json({ message: "Please wait 60 seconds before requesting a new OTP." });
        }

        const otp = generateOtp();
        await saveOtp(email, otp);
        await sendResetPasswordEmail(email, otp);
        await redisClient.set(cooldownKey, "active", { EX: 60 });

        return res.status(200).json({
            message: "Password reset OTP has been sent to your email.",
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, OTP, and new password are required" });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const isValid = await verifyOtpValue(email, otp);
        if (!isValid) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.isVerified = true;
        await user.save();
        
        await deleteOtp(email);
        await blacklistTokens(req);

        return res.status(200).json({
            message: "Password has been reset successfully. Please login with your new password.",
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { firstname, lastname, phoneNumber } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        if (firstname) user.firstname = firstname;
        if (lastname !== undefined) user.lastname = lastname;
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
        
        await user.save();
        
        return res.status(200).json({ message: "Profile updated successfully", user });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current and new password are required" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }
        
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect current password" });
        }
        
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        
        return res.status(200).json({ message: "Password changed successfully" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getProfile,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    googleLogin,
    googleRegister,
    updateProfile,
    changePassword
};
