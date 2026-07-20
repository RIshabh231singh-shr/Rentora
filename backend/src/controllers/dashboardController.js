const MaintenanceRequest = require("../models/maintainanceRequest");
const Booking = require("../models/booking");
const Property = require("../models/property");
const Notification = require("../models/notification");
const Amenity = require("../models/amenity");

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
        let amenityBookingsCount = 0;

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
                .populate("property", "propertyName propertyAddress city state pricePerHour rentType")
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

            // Rented monthly properties where they are a tenant
            var rentedProperties = await Property.find({
                tenants: userId
            }).populate("owner", "firstname lastname email phoneNumber").lean();

            // Amenity bookings count
            amenityBookingsCount = await Booking.countDocuments({
                user: userId,
                amenity: { $ne: null },
                status: { $in: ["booked", "checked_in"] }
            });
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

            // Amenity bookings for landlord's properties
            const landlordAmenities = await Amenity.find({ property: { $in: propertyIds } }).select("_id");
            const amenityIds = landlordAmenities.map(a => a._id);
            amenityBookingsCount = await Booking.countDocuments({
                amenity: { $in: amenityIds },
                status: { $in: ["booked", "checked_in", "completed"] }
            });

            var pendingBookings = await Booking.find({
                property: { $in: propertyIds },
                status: "pending"
            })
                .populate("user", "firstname lastname email")
                .populate("property", "propertyName propertyAddress")
                .populate("amenity", "name")
                .sort({ createdAt: -1 })
                .lean();

            var pendingLeases = await Property.find({
                owner: req.user._id,
                pendingTenants: { $exists: true, $not: { $size: 0 } }
            })
                .populate("pendingTenants", "firstname lastname email")
                .lean();
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

        const notificationsList = await Notification.find({ recipient: req.user._id })
            .populate("relatedBooking", "_id status")
            .populate("relatedUser", "_id firstname lastname email")
            .populate("relatedProperty", "_id propertyName")
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        res.status(200).json({
            stats: {
                activeRequests: activeRequestsCount,
                completedRequests: completedRequestsCount,
                upcomingBookings: upcomingBookingsCount,
                currentBooking: currentBookingName,
                amenityBookings: amenityBookingsCount
            },
            recentRequests,
            upcomingBookingsList,
            rentedProperties: typeof rentedProperties !== "undefined" ? rentedProperties : [],
            pendingBookings: typeof pendingBookings !== "undefined" ? pendingBookings : [],
            pendingLeases: typeof pendingLeases !== "undefined" ? pendingLeases : [],
            notifications: notificationsList || []
        });
    } catch (err) {
        console.error("getDashboardData error:", err);
        res.status(500).json({ message: "An error occurred while fetching dashboard data." });
    }
};

const markNotificationsAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, status: "unread" },
            { $set: { status: "read" } }
        );
        return res.status(200).json({ success: true, message: "Notifications marked as read" });
    } catch (err) {
        console.error("markNotificationsAsRead error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    getDashboardData,
    markNotificationsAsRead
};
