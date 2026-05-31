const jwt = require("jsonwebtoken");
const User = require("../models/user.js");
const redisClient = require("../config/redis.js");

const adminAuthMiddleware = async (req, res, next) => {
    try {
        const { accesstoken } = req.cookies;
        if (!accesstoken) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const payload = jwt.verify(accesstoken, process.env.JWT_ACCESS_SECRET);
        const { id, role } = payload;
        // Role check: Only Admin is allowed to access admin areas
        if (role !== "admin") {
            return res.status(403).json({ message: "Forbidden: Access denied" });
        }

        if (!id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const isblacklisted = await redisClient.exists(`blacklist:${accesstoken}`);
        if (isblacklisted) {
            return res.status(401).json({ message: "Unauthorized! Token is not valid" });
        }

        const user = await User.findById(id).select("-password");
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }
};

module.exports = adminAuthMiddleware;
