const MaintenanceRequest = require("../models/maintainanceRequest");
const Booking = require("../models/booking");
const Property = require("../models/property");

const getDashboardData = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch counts & listings based on user role
        let recentRequests = [];
        let activeRequestsCount = 0;
        let completedRequestsCount = 0;
        let upcomingBookingsCount = 0;
        let currentBookingName = "None";
        let upcomingBookingsList = [];

        if (req.user.role === "tenant") {
            // Active requests: pending, assigned, in_progress
            activeRequestsCount = await MaintenanceRequest.countDocuments({
                user: userId,
                status: { $in: ["pending", "assigned", "in_progress"] }
            });

            // Completed requests: resolved
            completedRequestsCount = await MaintenanceRequest.countDocuments({
                user: userId,
                status: "resolved"
            });

            // Recent requests (top 3)
            recentRequests = await MaintenanceRequest.find({ user: userId })
                .sort({ createdAt: -1 })
                .limit(3);

            const now = new Date();

            // Upcoming bookings: count
            upcomingBookingsCount = await Booking.countDocuments({
                user: userId,
                bookingStartTime: { $gt: now },
                status: "booked"
            });

            // Upcoming bookings list (top 5)
            upcomingBookingsList = await Booking.find({
                user: userId,
                bookingEndTime: { $gt: now },
                status: { $ne: "cancelled" }
            })
                .populate("amenity", "name category pricePerHour")
                .sort({ bookingStartTime: 1 })
                .limit(5);

            // Current booking (currently happening)
            const currentBooking = await Booking.findOne({
                user: userId,
                bookingStartTime: { $lte: now },
                bookingEndTime: { $gte: now },
                status: "booked"
            }).populate("amenity", "name");

            if (currentBooking && currentBooking.amenity) {
                currentBookingName = currentBooking.amenity.name;
            }
        } else if (req.user.role === "landlord") {
            const landlordProperties = await Property.find({ owner: req.user._id }).select("_id");
            const propertyIds = landlordProperties.map(p => p._id);

            // Active requests: pending, assigned, in_progress
            activeRequestsCount = await MaintenanceRequest.countDocuments({
                property: { $in: propertyIds },
                status: { $in: ["pending", "assigned", "in_progress"] }
            });

            completedRequestsCount = await MaintenanceRequest.countDocuments({
                property: { $in: propertyIds },
                status: "resolved"
            });

            recentRequests = await MaintenanceRequest.find({ property: { $in: propertyIds } })
                .sort({ createdAt: -1 })
                .limit(3);
        } else if (req.user.role === "admin") {
            // Active requests: pending, assigned, in_progress
            activeRequestsCount = await MaintenanceRequest.countDocuments({
                status: { $in: ["pending", "assigned", "in_progress"] }
            });

            completedRequestsCount = await MaintenanceRequest.countDocuments({
                status: "resolved"
            });

            recentRequests = await MaintenanceRequest.find()
                .sort({ createdAt: -1 })
                .limit(3);
        }

        res.status(200).json({
            stats: {
                activeRequests: activeRequestsCount,
                completedRequests: completedRequestsCount,
                upcomingBookings: upcomingBookingsCount,
                currentBooking: currentBookingName
            },
            recentRequests,
            upcomingBookingsList
        });
    } catch (err) {
        console.error("getDashboardData error:", err);
        res.status(500).json({ message: "An error occurred while fetching dashboard data." });
    }
};

module.exports = {
    getDashboardData
};
