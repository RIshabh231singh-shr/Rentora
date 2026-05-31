const User = require("../models/user");
const validateUser = require("../utilities/validatorUser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");


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
            path : "/auth/refresh"
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
            path : "/auth/refresh"
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
            const decodedAccess = jwt.verify(
                accessToken,
                process.env.JWT_ACCESS_SECRET
            );
            await redisClient.set(
                `blacklist:${accessToken}`,
                "blocked"
            );
            await redisClient.expireAt(
                `blacklist:${accessToken}`,
                decodedAccess.exp
            );
        }

        if(refreshToken){

            const decodedRefresh = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET
            );
            await redisClient.set(
                `blacklist:${refreshToken}`,
                "blocked"
            );
            await redisClient.expireAt(
                `blacklist:${refreshToken}`,
                decodedRefresh.exp
            );
        }

        res.clearCookie("accessToken");

        res.clearCookie("refreshToken", {
            path : "/auth/refresh"
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
            secure : process.env.NODE_ENV === "production",
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


module.exports = {registerUser,loginUser,logoutUser,refreshAccessToken};