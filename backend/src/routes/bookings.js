const express = require("express");
const router = express.Router();

const tenantAuthMiddleware = require("../middleware/tenantmiddleware");

const {
    bookAmenity,
    getBookingsForAmenity,
    getMyBookings,
    getBookingById,
    checkIn,
    checkOut,
    cancelBooking,
    getSlotAvailability,
    bookProperty,
    getPropertySlotAvailability,
} = require("../controllers/bookingManagement");


router.post("/book", tenantAuthMiddleware, bookAmenity);
router.post("/property/book", tenantAuthMiddleware, bookProperty);
router.get("/my", tenantAuthMiddleware, getMyBookings);


router.get("/amenity/:amenityId/availability", tenantAuthMiddleware, getSlotAvailability);
router.get("/property/:propertyId/availability", tenantAuthMiddleware, getPropertySlotAvailability);


router.get("/amenity/:amenityId", tenantAuthMiddleware, getBookingsForAmenity);


router.get("/:bookingId", tenantAuthMiddleware, getBookingById);

// Check-in / Check-out
router.post("/:bookingId/checkin", tenantAuthMiddleware, checkIn);
router.post("/:bookingId/checkout", tenantAuthMiddleware, checkOut);


// Cancel booking
router.delete("/:bookingId", tenantAuthMiddleware, cancelBooking);


module.exports = router;
