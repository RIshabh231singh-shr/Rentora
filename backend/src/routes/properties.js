const express = require("express");
const router = express.Router();

const landlordAuthMiddleware = require("../middleware/landlordMiddleware");
const tenantAuthMiddleware = require("../middleware/tenantMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
    createProperty,
    updateProperty,
    deleteProperty,
    getAllProperties,
    getPropertyById,
    addTenantToProperty,
    removeTenantFromProperty,
    getTenantsOfProperty,
    acceptTenantRequest,
    rejectTenantRequest,
    getPendingTenantRequests
} = require("../controllers/propertyController");

// Landlord Routes
router.post("/", landlordAuthMiddleware, upload.array("images", 5), createProperty);
router.get("/pending-requests", landlordAuthMiddleware, getPendingTenantRequests);
router.patch("/:propertyId", landlordAuthMiddleware, updateProperty);
router.delete("/:propertyId", landlordAuthMiddleware, deleteProperty);

// Common / Tenant Routes
router.get("/", tenantAuthMiddleware, getAllProperties);
router.get("/:propertyId", tenantAuthMiddleware, getPropertyById);

// Tenant Management Routes
router.post("/:propertyId/tenants", tenantAuthMiddleware, addTenantToProperty);
router.delete("/:propertyId/tenants/:tenantId", tenantAuthMiddleware, removeTenantFromProperty);
router.get("/:propertyId/tenants", tenantAuthMiddleware, getTenantsOfProperty);
router.post("/:propertyId/tenants/:tenantId/accept", landlordAuthMiddleware, acceptTenantRequest);
router.post("/:propertyId/tenants/:tenantId/reject", landlordAuthMiddleware, rejectTenantRequest);

module.exports = router;
