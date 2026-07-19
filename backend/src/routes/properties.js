const express = require("express");
const router = express.Router();

const landlordAuthMiddleware = require("../middleware/landlordmiddleware");
const tenantAuthMiddleware = require("../middleware/tenantmiddleware");
const upload = require("../middleware/upload");

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
} = require("../controllers/propertymangement");

// Landlord Routes
router.post("/", landlordAuthMiddleware, upload.single("image"), createProperty);
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
