const User = require("../models/user");
const validateUser = require("../utilities/validatorUser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");
const { OAuth2Client } = require("google-auth-library");
const { generateOtp, sendOtpEmail, saveOtp, verifyOtpValue, deleteOtp } = require("../utilities/otpService");


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
}

async function blacklistTokens(req) {
    const { accessToken, refreshToken } = req.cookies || {};
    if (accessToken) {
        try {
            const decodedAccess = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
            if (redisClient.isOpen) {
                await redisClient.set(`blacklist:${accessToken}`, "blocked");
                await redisClient.expireAt(`blacklist:${accessToken}`, decodedAccess.exp);
            }
        } catch (err) {}
    }
    if (refreshToken) {
        try {
            const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            if (redisClient.isOpen) {
                await redisClient.set(`blacklist:${refreshToken}`, "blocked");
                await redisClient.expireAt(`blacklist:${refreshToken}`, decodedRefresh.exp);
            }
        } catch (err) {}
    }
}

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
            await sendOtpEmail(email, otp);
            
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
        await sendOtpEmail(email, otp);

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

const loginUser = async (req,res) => {
    try{
        const {email,password} = req.body;
        if(!email || !password) {
            throw new Error("Email and password are required");
        }

        const user = await User.findOne({email});
        if(!user) {
            throw new Error("Invalid Credentials");
        }
        
        const isPasswordValid = await bcrypt.compare(password,user.password);
        if(!isPasswordValid) {
            throw new Error("Invalid Credentials");
        }
        
        if(!user.isVerified) {
            const otp = generateOtp();
            await saveOtp(email, otp);
            await sendOtpEmail(email, otp);
            return res.status(403).json({
                requiresVerification: true,
                email: user.email,
                message: "Account not verified. A new verification OTP has been sent."
            });
        }
        
        const payload = {
            id : user._id,
            email : user.email,
            role : user.role
        }

        await blacklistTokens(req);

        const accessToken = jwt.sign(
            payload,
            process.env.JWT_ACCESS_SECRET,
            {expiresIn : "15m"}
        );
        const refreshToken = jwt.sign(
            payload,
            process.env.JWT_REFRESH_SECRET,
            {expiresIn : "7d"}
        );
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path : "/auth"
        });
        const userData = {
            id : user._id,
            firstname : user.firstname,
            lastname : user.lastname,
            email : user.email,
            phoneNumber : user.phoneNumber,
            role : user.role,
            isVerified : user.isVerified,
            profilePicture : user.profilePicture || null
        }
        return res.status(200).json({userData,message:"User logged in successfully"});
        
    }
    catch(err){
        return res.status(401).json({message : err.message});
    }
}

const logoutUser = async (req, res) => {
    try{
        const { accessToken, refreshToken } = req.cookies;
        if(accessToken){
            try {
                const decodedAccess = jwt.verify(
                    accessToken,
                    process.env.JWT_ACCESS_SECRET
                );
                if (redisClient.isOpen) {
                    await redisClient.set(
                        `blacklist:${accessToken}`,
                        "blocked"
                    );
                    await redisClient.expireAt(
                        `blacklist:${accessToken}`,
                        decodedAccess.exp
                    );
                }
            } catch (err) {
                console.warn("Could not blacklist accessToken during logout:", err.message);
            }
        }

        if(refreshToken){
            try {
                const decodedRefresh = jwt.verify(
                    refreshToken,
                    process.env.JWT_REFRESH_SECRET
                );
                if (redisClient.isOpen) {
                    await redisClient.set(
                        `blacklist:${refreshToken}`,
                        "blocked"
                    );
                    await redisClient.expireAt(
                        `blacklist:${refreshToken}`,
                        decodedRefresh.exp
                    );
                }
            } catch (err) {
                console.warn("Could not blacklist refreshToken during logout:", err.message);
            }
        }

        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: true,
            sameSite: "none"
        });

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path : "/auth"
        });

        return res.status(200).json({
            message : "User logged out successfully"
        });

    }catch(err){
        return res.status(500).json({
            message : err.message
        });
    }
};

const refreshAccessToken = async (req, res) => {
    try{
        const { refreshToken } = req.cookies;
        if(!refreshToken){
            return res.status(401).json({
                message : "Refresh token missing"
            });
        }

        if (redisClient.isOpen) {
            const isBlacklisted = await redisClient.exists(`blacklist:${refreshToken}`);
            if (isBlacklisted) {
                return res.status(401).json({
                    message : "Refresh token is blacklisted"
                });
            }
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );
        const accessToken = jwt.sign(
            {
                id : decoded.id,
                role : decoded.role,
                email : decoded.email
            },
            process.env.JWT_ACCESS_SECRET,
            {
                expiresIn : "15m"
            }
        );
        res.cookie("accessToken", accessToken, {
            httpOnly : true,
            secure : true,
            sameSite : "none",
            maxAge : 15 * 60 * 1000
        });
        return res.status(200).json({
            message : "Access token refreshed"
        });

    }catch(err){
        return res.status(401).json({
            message : "Invalid refresh token"
        });

    }

};

const getProfile = async (req,res) => {
    try{
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
    }catch(err){
        return res.status(500).json({
            message : err.message
        });
    }
}

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

        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/auth",
        });

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
        const isOnCooldown = await redisClient.get(cooldownKey);
        if (isOnCooldown) {
            return res.status(429).json({ message: "Please wait 60 seconds before requesting a new OTP." });
        }

        const otp = generateOtp();
        await saveOtp(email, otp);
        await sendOtpEmail(email, otp);
        await redisClient.set(cooldownKey, "active", { EX: 60 });

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
            if (!user.googleId) {
                user.googleId = googleId;
                if (profilePicture && !user.profilePicture) {
                    user.profilePicture = profilePicture;
                }
                await user.save();
            }

            const jwtPayload = {
                id: user._id,
                email: user.email,
                role: user.role,
            };

            const accessToken = jwt.sign(jwtPayload, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
            const refreshToken = jwt.sign(jwtPayload, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 15 * 60 * 1000,
            });

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: "/auth",
            });

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

        const accessToken = jwt.sign(jwtPayload, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign(jwtPayload, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/auth",
        });

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

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getProfile,
    verifyOtp,
    resendOtp,
    googleLogin,
    googleRegister
};