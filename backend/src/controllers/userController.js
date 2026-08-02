const User = require("../models/user");
const cloudinary = require("../config/cloudinary");

const uploadStream = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "rentora/profiles" },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(fileBuffer);
    });
};

// GET /api/users
const getUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;
        let query = {};
        
        if (role && role !== "all") {
            query.role = role;
        }

        if (search) {
            query.$or = [
                { firstname: { $regex: search, $options: "i" } },
                { lastname: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [users, total] = await Promise.all([
            User.find(query)
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            User.countDocuments(query)
        ]);
        
        return res.status(200).json({ 
            success: true, 
            data: users,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error("getUsers error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// PUT /api/users/:id/role
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ["tenant", "landlord", "admin", "maintenance_staff"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role specified." });
        }

        const user = await User.findByIdAndUpdate(id, { role, requestedRole: null }, { new: true }).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        return res.status(200).json({ success: true, message: "Role updated successfully.", data: user });
    } catch (err) {
        console.error("updateUserRole error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// POST /api/users/request-role
const requestRoleChange = async (req, res) => {
    try {
        const { requestedRole } = req.body;
        const validRoles = ["tenant", "landlord", "admin", "maintenance_staff"];
        
        if (!validRoles.includes(requestedRole)) {
            return res.status(400).json({ success: false, message: "Invalid role specified." });
        }

        if (req.user.role === requestedRole) {
            return res.status(400).json({ success: false, message: "You already have this role." });
        }

        const user = await User.findByIdAndUpdate(req.user.id, { requestedRole }, { new: true }).select("-password");

        // Notify Admins
        const Notification = require("../models/notification");
        const admins = await User.find({ role: "admin" }).select("_id");
        if (admins.length > 0) {
            const notifs = admins.map(admin => ({
                recipient: admin._id,
                type: "ROLE_CHANGE_REQUEST",
                title: "Role Change Request",
                message: `${user.firstname} ${user.lastname} requested to become a ${requestedRole}.`,
                relatedUser: user._id
            }));
            await Notification.insertMany(notifs);
        }

        return res.status(200).json({ success: true, message: "Role change requested successfully.", data: user });
    } catch (err) {
        console.error("requestRoleChange error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// POST /api/users/profile-picture
const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image file provided." });
        }

        const result = await uploadStream(req.file.buffer);
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { profilePicture: result.secure_url },
            { new: true }
        ).select("-password");

        return res.status(200).json({ success: true, message: "Profile picture updated.", data: user });
    } catch (err) {
        console.error("uploadProfilePicture error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// POST /api/users/role-request/:userId/approve
const approveRoleRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const targetUser = await User.findById(userId);
        if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });
        if (!targetUser.requestedRole) return res.status(400).json({ success: false, message: "No pending role request" });

        const oldRole = targetUser.role;
        targetUser.role = targetUser.requestedRole;
        targetUser.requestedRole = null;
        await targetUser.save();

        const Notification = require("../models/notification");
        await Notification.create({
            recipient: targetUser._id,
            type: "SYSTEM",
            title: "Role Change Approved",
            message: `Your request to become a ${targetUser.role} has been approved.`
        });

        // Delete the request notification for admins
        await Notification.updateMany(
            { type: "ROLE_CHANGE_REQUEST", relatedUser: targetUser._id },
            { $set: { status: "read", message: `Role change to ${targetUser.role} approved.` } }
        );

        const { clearAllDashboardCaches } = require("../utilities/cacheHelper");
        await clearAllDashboardCaches();

        return res.status(200).json({ success: true, message: "Role approved successfully" });
    } catch (err) {
        console.error("approveRoleRequest error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// POST /api/users/role-request/:userId/reject
const rejectRoleRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const targetUser = await User.findById(userId);
        if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });
        if (!targetUser.requestedRole) return res.status(400).json({ success: false, message: "No pending role request" });

        const requestedRole = targetUser.requestedRole;
        targetUser.requestedRole = null;
        await targetUser.save();

        const Notification = require("../models/notification");
        await Notification.create({
            recipient: targetUser._id,
            type: "SYSTEM",
            title: "Role Change Rejected",
            message: `Your request to become a ${requestedRole} has been rejected.`
        });

        // Delete the request notification for admins
        await Notification.updateMany(
            { type: "ROLE_CHANGE_REQUEST", relatedUser: targetUser._id },
            { $set: { status: "read", message: `Role change to ${requestedRole} rejected.` } }
        );

        const { clearAllDashboardCaches } = require("../utilities/cacheHelper");
        await clearAllDashboardCaches();

        return res.status(200).json({ success: true, message: "Role rejected successfully" });
    } catch (err) {
        console.error("rejectRoleRequest error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    getUsers,
    updateUserRole,
    requestRoleChange,
    approveRoleRequest,
    rejectRoleRequest,
    uploadProfilePicture,
};
