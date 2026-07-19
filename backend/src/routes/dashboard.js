const express = require("express");
const router = express.Router();
const tenantAuthMiddleware = require("../middleware/tenantmiddleware");
const { getDashboardData } = require("../controllers/dashboardController");

router.get("/", tenantAuthMiddleware, getDashboardData);

module.exports = router;
