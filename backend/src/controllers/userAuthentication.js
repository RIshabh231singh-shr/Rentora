const User = require("../models/user");
const validateUser = require("../utilities/validatorUser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
    try{
        validateUser(req.body);
        
        const { email } = req.body;
        
        const exist = await User.exists({email});
        if(exist){
            throw new Error("Email already exists");
        }
        req.body.password = await bcrypt.hash(req.body.password,10);
        req.body.role = "tenant";
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

module.exports = {registerUser};