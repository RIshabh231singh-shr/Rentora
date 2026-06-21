const User = require("../models/user");
const validateUser = require("../utilities/validatorUser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
}



const registerUser = async (req, res) => {
    try{
        validateUser(req.body);
        
        const { email } = req.body;
        
        const exist = await User.exists({email});
        if(exist){
            throw new Error("Email already exists");
        }
        req.body.password = await bcrypt.hash(req.body.password,10);
        req.body.role = req.body.role || "tenant";
        const user = await User.create(req.body);

        const payload =  {
            id : user._id,
            email : user.email ,
            role : user.role,
        }

        const accessToken = jwt.sign(
            payload,
            process.env.JWT_ACCESS_SECRET,
            {expiresIn : "15m"}
        )
        const refreshToken = jwt.sign(
            payload,
            process.env.JWT_REFRESH_SECRET,
            {expiresIn : "7d"}
        )
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
        return res.status(201).json({userData,message:"User registered successfully"});

    }catch(err){
        if (err.code === 11000) {
            return res.status(400).json({message : "Email already exists"});
        }
        return res.status(400).json({message : err.message});
    }
}

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
        /*
        if(!user.isVerified){
            throw new Error("User is not verified");
        }
        */
        const isPasswordValid = await bcrypt.compare(password,user.password);
        if(!isPasswordValid) {
            throw new Error("Invalid Credentials");
        }
        const payload = {
            id : user._id,
            email : user.email,
            role : user.role
        }
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
    googleLogin,
    googleRegister
};