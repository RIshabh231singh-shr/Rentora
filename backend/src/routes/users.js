const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/tenantMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
    getUsers,
    updateUserRole,
    requestRoleChange,
    approveRoleRequest,
    rejectRoleRequest,
    uploadProfilePicture
} = require("../controllers/userController");

// Admin or Landlord can fetch users (like staff)
router.get("/", authMiddleware, getUsers);

// Normal user requests a role change
router.post("/request-role", authMiddleware, requestRoleChange);

// Admin approves or rejects role change request
router.post("/role-request/:userId/approve", adminMiddleware, approveRoleRequest);
router.post("/role-request/:userId/reject", adminMiddleware, rejectRoleRequest);

// Upload profile picture
router.post("/profile-picture", authMiddleware, upload.single("profilePicture"), uploadProfilePicture);

// Only admin can change user roles
router.put("/:id/role", adminMiddleware, updateUserRole);

module.exports = router;

