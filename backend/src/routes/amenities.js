const express = require("express");
const router = express.Router();

const landlordAuthMiddleware = require("../middleware/landlordmiddleware");
const tenantAuthMiddleware = require("../middleware/tenantmiddleware");

const {
    createAmenity,
    getAmenities,
    getAmenityById,
    updateAmenity,
    deleteAmenity,
} = require("../controllers/userAmenity");

router.post("/", landlordAuthMiddleware, createAmenity);
router.patch("/:amenityId", landlordAuthMiddleware, updateAmenity);
router.delete("/:amenityId", landlordAuthMiddleware, deleteAmenity);

// Amenity Read (Any authenticated user)
router.get("/", tenantAuthMiddleware, getAmenities);
router.get("/:amenityId", tenantAuthMiddleware, getAmenityById);

module.exports = router;
