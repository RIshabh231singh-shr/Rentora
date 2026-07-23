const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authmiddleware");
const adminMiddleware = require("../middleware/adminmiddleware");
const upload = require("../middleware/upload");
const { getUsers, updateUserRole, requestRoleChange, uploadProfilePicture } = require("../controllers/userController");

// Admin or Landlord can fetch users (like staff)
router.get("/", authMiddleware, getUsers);

// Normal user requests a role change
router.post("/request-role", authMiddleware, requestRoleChange);

// Upload profile picture
router.post("/profile-picture", authMiddleware, upload.single("profilePicture"), uploadProfilePicture);

// Only admin can change user roles
router.put("/:id/role", adminMiddleware, updateUserRole);

module.exports = router;
