const express = require("express");
const router = express.Router();
const tenantAuthMiddleware = require("../middleware/tenantmiddleware");
const upload = require("../middleware/upload");
const { createRequest, getRequests } = require("../controllers/maintenanceController");

// Create request with file upload support
router.post("/", tenantAuthMiddleware, upload.single("image"), createRequest);

// Get requests based on role
router.get("/", tenantAuthMiddleware, getRequests);

module.exports = router;
