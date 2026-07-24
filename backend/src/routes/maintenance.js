const express = require("express");
const router = express.Router();
const tenantAuthMiddleware = require("../middleware/tenantMiddleware");
const landlordAuthMiddleware = require("../middleware/landlordMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { createRequest, getRequests, updateRequestStatus, assignStaff, getMaintenanceKPIs, submitReview } = require("../controllers/maintenanceController");

// KPI stats — any authenticated user (role-scoped inside controller)
router.get("/kpi", tenantAuthMiddleware, getMaintenanceKPIs);

// Create request with file upload support
router.post("/", tenantAuthMiddleware, upload.single("image"), createRequest);

// Get requests based on role
router.get("/", tenantAuthMiddleware, getRequests);

// Update request status (landlord / admin only)
router.put("/:requestId/status", tenantAuthMiddleware, updateRequestStatus);

// Assign staff (landlord / admin only)
router.put("/:requestId/assign", landlordAuthMiddleware, assignStaff);

// Submit review (tenant only)
router.post("/:id/review", tenantAuthMiddleware, submitReview);

module.exports = router;
