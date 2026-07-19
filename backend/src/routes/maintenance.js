const express = require("express");
const router = express.Router();
const tenantAuthMiddleware = require("../middleware/tenantmiddleware");
const upload = require("../middleware/upload");
const { createRequest, getRequests, updateRequestStatus } = require("../controllers/maintenanceController");

// Create request with file upload support
router.post("/", tenantAuthMiddleware, upload.single("image"), createRequest);

// Get requests based on role
router.get("/", tenantAuthMiddleware, getRequests);

// Update request status (landlord / admin only)
router.put("/:requestId/status", tenantAuthMiddleware, updateRequestStatus);

module.exports = router;
