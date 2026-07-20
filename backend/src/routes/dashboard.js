const express = require("express");
const router = express.Router();
const tenantAuthMiddleware = require("../middleware/tenantmiddleware");
const { getDashboardData, markNotificationsAsRead } = require("../controllers/dashboardController");

router.get("/", tenantAuthMiddleware, getDashboardData);
router.put("/notifications/mark-read", tenantAuthMiddleware, markNotificationsAsRead);

module.exports = router;
