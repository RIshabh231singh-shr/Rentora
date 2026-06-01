const express = require("express");
const router = express.Router();

const landlordAuthMiddleware = require("../middleware/landlordmiddleware");
const tenantAuthMiddleware = require("../middleware/tenantmiddleware");

const {
    createProperty,
    updateProperty,
    deleteProperty,
    getAllProperties,
    getPropertyById,
    addTenantToProperty,
    removeTenantFromProperty,
    getTenantsOfProperty
} = require("../controllers/propertymangement");

// Landlord Routes
router.post("/", landlordAuthMiddleware, createProperty);
router.patch("/:propertyId", landlordAuthMiddleware, updateProperty);
router.delete("/:propertyId", landlordAuthMiddleware, deleteProperty);

// Common / Tenant Routes
router.get("/", tenantAuthMiddleware, getAllProperties);
router.get("/:propertyId", tenantAuthMiddleware, getPropertyById);

// Tenant Management Routes
router.post("/:propertyId/tenants", tenantAuthMiddleware, addTenantToProperty);
router.delete("/:propertyId/tenants/:tenantId", tenantAuthMiddleware, removeTenantFromProperty);
router.get("/:propertyId/tenants", tenantAuthMiddleware, getTenantsOfProperty);

module.exports = router;
