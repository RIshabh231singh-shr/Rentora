const mongoose = require("mongoose");
const Amenity = require("../models/amenity");
const Booking = require("../models/booking");
const Property = require("../models/property");
const Notification = require("../models/notification");
const redisClient = require("../config/redis");

const bookAmenity = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { amenityId, bookingStartTime, bookingEndTime } = req.body;

        if (!amenityId || !bookingStartTime || !bookingEndTime) {
            return res.status(422).json({
                success: false,
                message: "amenityId, bookingStartTime, and bookingEndTime are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(amenityId)) {
            return res.status(400).json({ success: false, message: "Invalid amenity ID" });
        }

        const start = new Date(bookingStartTime);
        const end = new Date(bookingEndTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(422).json({ success: false, message: "Invalid date format" });
        }

        if (start >= end) {
            return res.status(422).json({ success: false, message: "Start time must be before end time" });
        }

        if (start < new Date()) {
            return res.status(422).json({ success: false, message: "Cannot book a slot in the past" });
        }

        const amenity = await Amenity.findById(amenityId).lean();
        if (!amenity) {
            return res.status(404).json({ success: false, message: "Amenity not found" });
        }

        if (!amenity.isActive) {
            return res.status(400).json({ success: false, message: "This amenity is currently unavailable" });
        }

        const property = await Property.findById(amenity.property).lean();
        if (!property) {
            return res.status(404).json({ success: false, message: "Associated property not found" });
        }
        
        const isTenant = property.tenants?.some(t => t.toString() === req.user.id.toString());
        const isOwner = property.owner?.toString() === req.user.id.toString();
        const isAdmin = req.user.role === "admin";
        
        if (!isTenant && !isOwner && !isAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: "Only approved tenants of this property can book its amenities" 
            });
        }

        let openMins, closeMins;
        if (amenity.openingHour !== undefined && amenity.closingHour !== undefined) {
            openMins  = amenity.openingHour  * 60;
            closeMins = amenity.closingHour  * 60;
        } else {
            const amenityOpen  = new Date(amenity.openingTime);
            const amenityClose = new Date(amenity.closingTime);
            openMins  = amenityOpen.getHours()  * 60 + amenityOpen.getMinutes();
            closeMins = amenityClose.getHours() * 60 + amenityClose.getMinutes();
        }
        if (closeMins === 0) closeMins = 24 * 60;

        const startMins = start.getHours() * 60 + start.getMinutes();
        const endMins   = end.getHours()   * 60 + end.getMinutes();

        if (startMins < openMins || endMins > closeMins || startMins >= endMins) {
            const fmtHour = (h) => `${h % 12 || 12}:00 ${h < 12 ? "AM" : "PM"}`;
            return res.status(400).json({
                success: false,
                message: `Booking must be within operating hours (${fmtHour(amenity.openingHour ?? openMins/60)} to ${fmtHour(amenity.closingHour ?? closeMins/60)})`
            });
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        let booking;

        try {
            const userConflict = await Booking.findOne({
                user: req.user.id,
                amenity: amenityId,
                status: { $in: ["booked", "checked_in"] },
                bookingStartTime: { $lt: end },
                bookingEndTime: { $gt: start },
            }).session(session).lean();

            if (userConflict) {
                await session.abortTransaction();
                session.endSession();
                const conflictStart = new Date(userConflict.bookingStartTime).toLocaleTimeString("en-US", {
                    hour: "numeric", minute: "2-digit", hour12: true
                });
                const conflictEnd = new Date(userConflict.bookingEndTime).toLocaleTimeString("en-US", {
                    hour: "numeric", minute: "2-digit", hour12: true
                });
                return res.status(409).json({
                    success: false,
                    message: `You already have a booking for this amenity from ${conflictStart} to ${conflictEnd}`,
                    conflictingBooking: userConflict._id,
                });
            }

            const overlappingCount = await Booking.countDocuments({
                amenity: amenityId,
                status: { $in: ["booked", "checked_in"] },
                bookingStartTime: { $lt: end },
                bookingEndTime: { $gt: start },
            }).session(session);

            if (overlappingCount >= amenity.capacity) {
                await session.abortTransaction();
                session.endSession();
                return res.status(409).json({
                    success: false,
                    message: `This slot is fully booked (${overlappingCount}/${amenity.capacity} capacity). Please choose another time.`,
                });
            }

            const [createdBooking] = await Booking.create([{
                user: req.user.id,
                property: amenity.property,
                amenity: amenityId,
                bookingStartTime: start,
                bookingEndTime: end,
                status: "pending",
                paymentStatus: "pending",
                totalAmount: 0,
            }], { session });
            
            booking = createdBooking;

            await session.commitTransaction();
            session.endSession();
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }

        Notification.create({
            recipient: property.owner,
            type: "BOOKING_CREATED",
            title: "New Amenity Booking Request",
            message: `${req.user.firstname || "A tenant"} requested to book ${amenity.name} at ${property.propertyName} from ${start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })} to ${end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })} on ${start.toLocaleDateString()}.`,
            relatedProperty: property._id,
            relatedBooking: booking._id,
            relatedUser: req.user.id,
            status: "unread"
        }).then(notif => {
            if (global.io) {
                global.io.to(property.owner.toString()).emit("notification", {
                    _id: notif._id,
                    type: notif.type,
                    title: notif.title,
                    message: notif.message,
                    relatedProperty: property._id,
                    relatedBooking: booking._id,
                    status: notif.status
                });
            }
        }).catch(err => console.error("Booking notification failed:", err));

        return res.status(201).json({
            success: true,
            message: "Booking confirmed successfully",
            data: booking,
        });

    } catch (err) {
        console.error("bookAmenity error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getBookingsForAmenity = async (req, res) => {
    try {
        const { amenityId } = req.params;
        const { date } = req.query;

        if (!mongoose.Types.ObjectId.isValid(amenityId)) {
            return res.status(400).json({ success: false, message: "Invalid amenity ID" });
        }

        let filter = {
            amenity: amenityId,
            status: { $in: ["booked", "checked_in"] },
        };

        if (date) {
            const dayStart = new Date(date);
            if (isNaN(dayStart.getTime())) {
                return res.status(422).json({ success: false, message: "Invalid date format. Use YYYY-MM-DD" });
            }
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);

            filter.bookingStartTime = { $gte: dayStart, $lt: dayEnd };
        }

        const bookings = await Booking.find(filter)
            .select("bookingStartTime bookingEndTime status user")
            .populate("user", "firstname lastname")
            .sort({ bookingStartTime: 1 })
            .lean();

        return res.status(200).json(bookings);

    } catch (err) {
        console.error("getBookingsForAmenity error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getMyBookings = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { status, upcoming, page, limit } = req.query;

        const pageNum  = Math.max(1, parseInt(page)  || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
        const skip     = (pageNum - 1) * limitNum;

        const cacheKey = `my_bookings_${req.user.id}_${status || "all"}_${upcoming || "false"}_p${pageNum}_l${limitNum}`;

        try {
            const cached = await redisClient.get(cacheKey);
            if (cached) return res.status(200).json(JSON.parse(cached));
        } catch (err) {}

        let filter = { user: req.user.id };

        if (status) {
            filter.status = status;
        }

        if (upcoming === "true") {
            filter.bookingStartTime = { $gte: new Date() };
            filter.status = { $in: ["booked", "checked_in"] };
        }

        const [bookings, totalCount] = await Promise.all([
            Booking.find(filter)
                .populate("amenity", "name description")
                .populate("property", "propertyName propertyAddress")
                .sort({ bookingStartTime: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Booking.countDocuments(filter)
        ]);

        const response = {
            success: true,
            bookings,
            totalCount,
            totalPages: Math.ceil(totalCount / limitNum),
            currentPage: pageNum,
        };

        try {
            await redisClient.setEx(cacheKey, 120, JSON.stringify(response));
        } catch (err) {}

        return res.status(200).json(response);

    } catch (err) {
        console.error("getMyBookings error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getBookingById = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { bookingId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ success: false, message: "Invalid booking ID" });
        }

        const booking = await Booking.findById(bookingId)
            .populate("amenity", "name description capacity")
            .populate("property", "propertyName propertyAddress")
            .populate("user", "firstname lastname email phoneNumber")
            .lean();

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const isBookingOwner = booking.user._id.toString() === req.user.id.toString();
        const isAdmin = req.user.role === "admin";
        const prop = await Property.findById(booking.property._id || booking.property).select("owner").lean();
        const isPropertyOwner = prop?.owner?.toString() === req.user.id.toString();

        if (!isBookingOwner && !isPropertyOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Unauthorized to view this booking" });
        }

        return res.status(200).json({ success: true, data: booking });

    } catch (err) {
        console.error("getBookingById error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const checkIn = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { bookingId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ success: false, message: "Invalid booking ID" });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.user.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: "Only the booking owner can check in" });
        }

        if (booking.status !== "booked") {
            return res.status(400).json({
                success: false,
                message: `Cannot check in — booking status is '${booking.status}'`
            });
        }

        const now = new Date();
        const earlyCheckinWindow = new Date(booking.bookingStartTime);
        earlyCheckinWindow.setMinutes(earlyCheckinWindow.getMinutes() - 30);

        if (now < earlyCheckinWindow) {
            return res.status(400).json({
                success: false,
                message: "Too early to check in. Check-in opens 30 minutes before your booking."
            });
        }

        if (now > booking.bookingEndTime) {
            booking.status = "completed";
            await booking.save();
            return res.status(400).json({
                success: false,
                message: "Booking time has passed. It has been marked as completed."
            });
        }

        booking.status = "checked_in";
        booking.checkInTime = now;
        await booking.save();

        return res.status(200).json({
            success: true,
            message: "Checked in successfully",
            data: {
                bookingId: booking._id,
                checkInTime: booking.checkInTime,
                status: booking.status,
            }
        });

    } catch (err) {
        console.error("checkIn error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const checkOut = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { bookingId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ success: false, message: "Invalid booking ID" });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.user.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: "Only the booking owner can check out" });
        }

        if (booking.status !== "checked_in") {
            return res.status(400).json({
                success: false,
                message: `Cannot check out — booking status is '${booking.status}'. Must be checked in first.`
            });
        }

        booking.status = "completed";
        booking.checkOutTime = new Date();
        await booking.save();

        return res.status(200).json({
            success: true,
            message: "Checked out successfully",
            data: {
                bookingId: booking._id,
                checkInTime: booking.checkInTime,
                checkOutTime: booking.checkOutTime,
                status: booking.status,
            }
        });

    } catch (err) {
        console.error("checkOut error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const cancelBooking = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { bookingId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ success: false, message: "Invalid booking ID" });
        }

        const booking = await Booking.findById(bookingId).populate("amenity", "name");
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const isBookingOwner = booking.user.toString() === req.user.id.toString();
        const isAdmin = req.user.role === "admin";

        const prop = await Property.findById(booking.property).select("owner").lean();
        const isPropertyOwner = prop?.owner?.toString() === req.user.id.toString();

        if (!isBookingOwner && !isPropertyOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Unauthorized to cancel this booking" });
        }

        if (booking.status === "completed") {
            return res.status(400).json({ success: false, message: "Cannot cancel a completed booking" });
        }

        if (booking.status === "cancelled") {
            return res.status(400).json({ success: false, message: "Booking is already cancelled" });
        }

        if (isPropertyOwner || isAdmin) {
            booking.status = "cancelled";
            await booking.save();

            Notification.create({
                recipient: booking.user,
                type: "BOOKING_CANCELLED",
                title: "Booking Cancelled",
                message: `Your booking for ${booking.amenity?.name || "property"} has been cancelled by the owner.`,
                relatedProperty: booking.property,
                relatedUser: req.user.id,
                status: "unread"
            }).catch(err => console.error("Cancel notification failed:", err));

            return res.status(200).json({
                success: true,
                message: "Booking cancelled successfully",
                data: { bookingId: booking._id, status: "cancelled" }
            });
        } else {
            booking.status = "cancellation_requested";
            await booking.save();

            Notification.create({
                recipient: prop.owner,
                type: "CANCELLATION_REQUESTED",
                title: "Cancellation Request",
                message: `Tenant has requested to cancel their booking for ${booking.amenity?.name || "property"}.`,
                relatedProperty: booking.property,
                relatedBooking: booking._id,
                relatedUser: req.user.id,
                status: "unread"
            }).catch(err => console.error("Cancel request notification failed:", err));

            return res.status(200).json({
                success: true,
                message: "Cancellation request sent to owner for approval.",
                data: { bookingId: booking._id, status: "cancellation_requested" }
            });
        }

    } catch (err) {
        console.error("cancelBooking error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const approveCancellation = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId).populate("property");
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        if (booking.status !== "cancellation_requested") {
            return res.status(400).json({ success: false, message: "Booking is not pending cancellation" });
        }

        const isOwner = booking.property?.owner?.toString() === req.user.id.toString();
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: "Unauthorized" });

        booking.status = "cancelled";
        await booking.save();

        if (booking.property && booking.property.rentType === "monthly") {
            await Property.findByIdAndUpdate(booking.property._id, {
                $pull: { tenants: booking.user }
            });
        }

        Notification.create({
            recipient: booking.user,
            type: "BOOKING_CANCELLED",
            title: "Cancellation Approved",
            message: `Your cancellation request for ${booking.property?.propertyName} has been approved.`,
            relatedProperty: booking.property._id,
            relatedBooking: booking._id,
            status: "unread"
        }).catch(() => {});

        return res.status(200).json({ success: true, message: "Cancellation approved successfully." });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const rejectCancellation = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId).populate("property");
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        if (booking.status !== "cancellation_requested") {
            return res.status(400).json({ success: false, message: "Booking is not pending cancellation" });
        }

        const isOwner = booking.property?.owner?.toString() === req.user.id.toString();
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: "Unauthorized" });

        booking.status = "booked";
        await booking.save();

        Notification.create({
            recipient: booking.user,
            type: "BOOKING_REJECTED",
            title: "Cancellation Rejected",
            message: `Your cancellation request for ${booking.property?.propertyName} was rejected by the owner.`,
            relatedProperty: booking.property._id,
            relatedBooking: booking._id,
            status: "unread"
        }).catch(() => {});

        return res.status(200).json({ success: true, message: "Cancellation request rejected." });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getSlotAvailability = async (req, res) => {
    try {
        const { amenityId } = req.params;
        const { date } = req.query;

        if (!mongoose.Types.ObjectId.isValid(amenityId)) {
            return res.status(400).json({ success: false, message: "Invalid amenity ID" });
        }

        if (!date) {
            return res.status(422).json({ success: false, message: "date query parameter is required (YYYY-MM-DD)" });
        }

        const dayStart = new Date(date);
        if (isNaN(dayStart.getTime())) {
            return res.status(422).json({ success: false, message: "Invalid date format" });
        }

        const amenity = await Amenity.findById(amenityId).lean();
        if (!amenity) {
            return res.status(404).json({ success: false, message: "Amenity not found" });
        }

        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const bookings = await Booking.find({
            amenity: amenityId,
            status: { $in: ["booked", "checked_in"] },
            bookingStartTime: { $gte: dayStart, $lt: dayEnd },
        })
            .select("bookingStartTime bookingEndTime user")
            .populate("user", "firstname lastname")
            .lean();

        return res.status(200).json({
            success: true,
            amenityId,
            date,
            amenityName: amenity.name,
            capacity: amenity.capacity,
            operatingHours: {
                open: amenity.openingTime,
                close: amenity.closingTime
            },
            bookings: bookings.map(b => ({
                bookingId: b._id,
                startTime: b.bookingStartTime,
                endTime: b.bookingEndTime,
                user: b.user
            }))
        });

    } catch (err) {
        console.error("getSlotAvailability error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const bookProperty = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { propertyId, bookingStartTime, bookingEndTime, durationMonths, startDate } = req.body;

        if (!propertyId) {
            return res.status(422).json({
                success: false,
                message: "propertyId is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({ success: false, message: "Invalid property ID" });
        }

        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ success: false, message: "Property not found" });
        }

        if (property.owner.toString() === req.user.id) {
            return res.status(400).json({ success: false, message: "You cannot rent your own property" });
        }

        let start, end, totalAmount;

        if (property.rentType === "monthly") {
            if (!durationMonths || isNaN(durationMonths) || durationMonths < 1) {
                return res.status(400).json({ success: false, message: "Lease duration in months is required" });
            }
            start = startDate ? new Date(startDate) : new Date();
            end = new Date(start);
            end.setMonth(end.getMonth() + Number(durationMonths));
            totalAmount = property.pricePerHour * Number(durationMonths);
        } else {
            if (!bookingStartTime || !bookingEndTime) {
                return res.status(422).json({
                    success: false,
                    message: "bookingStartTime and bookingEndTime are required for hourly bookings"
                });
            }

            start = new Date(bookingStartTime);
            end = new Date(bookingEndTime);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(422).json({ success: false, message: "Invalid date format" });
            }

            if (start >= end) {
                return res.status(422).json({ success: false, message: "Start time must be before end time" });
            }

            if (start < new Date()) {
                return res.status(422).json({ success: false, message: "Cannot book a slot in the past" });
            }

            const durationHours = (end - start) / (1000 * 60 * 60);
            totalAmount = Math.ceil(durationHours * property.pricePerHour);
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        let booking;

        try {
            if (property.rentType !== "monthly") {
                const conflict = await Booking.findOne({
                    property: propertyId,
                    amenity: null,
                    status: { $in: ["booked", "checked_in"] },
                    $or: [
                        { bookingStartTime: { $lt: end }, bookingEndTime: { $gt: start } }
                    ]
                }).session(session).lean();

                if (conflict) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({ success: false, message: "This time slot is already booked for this property" });
                }
            }

            const [createdBooking] = await Booking.create([{
                user: req.user.id,
                property: propertyId,
                bookingStartTime: start,
                bookingEndTime: end,
                totalAmount,
                paymentStatus: "pending",
                status: "pending"
            }], { session });
            
            booking = createdBooking;

            await session.commitTransaction();
            session.endSession();
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }

        Notification.create({
            recipient: property.owner,
            type: "BOOKING_CREATED",
            title: "New Booking Request",
            message: `${req.user.email} has requested to rent ${property.propertyName} from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
            relatedProperty: propertyId,
            relatedBooking: booking._id,
            relatedUser: req.user.id,
            status: "unread"
        }).then(notif => {
            if (global.io) {
                global.io.to(property.owner.toString()).emit("notification", {
                    _id: notif._id,
                    type: notif.type,
                    title: notif.title,
                    message: notif.message,
                    relatedProperty: propertyId,
                    relatedBooking: booking._id,
                    status: notif.status
                });
            }
        }).catch(err => console.error("Booking notification failed:", err));

        return res.status(201).json({
            success: true,
            message: "Booking request submitted successfully",
            data: booking
        });

    } catch (err) {
        console.error("bookProperty error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getPropertySlotAvailability = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { date } = req.query;

        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({ success: false, message: "Invalid property ID" });
        }

        if (!date) {
            return res.status(422).json({ success: false, message: "date query parameter is required (YYYY-MM-DD)" });
        }

        const dayStart = new Date(date);
        if (isNaN(dayStart.getTime())) {
            return res.status(422).json({ success: false, message: "Invalid date format" });
        }

        const property = await Property.findById(propertyId).lean();
        if (!property) {
            return res.status(404).json({ success: false, message: "Property not found" });
        }

        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const bookings = await Booking.find({
            property: propertyId,
            amenity: null,
            status: { $in: ["booked", "checked_in"] },
            bookingStartTime: { $gte: dayStart, $lt: dayEnd },
        })
            .select("bookingStartTime bookingEndTime user")
            .populate("user", "firstname lastname email")
            .lean();

        return res.status(200).json({
            success: true,
            propertyId,
            date,
            propertyName: property.propertyName,
            bookings: bookings.map(b => ({
                bookingId: b._id,
                startTime: b.bookingStartTime,
                endTime: b.bookingEndTime,
                user: b.user
            }))
        });

    } catch (err) {
        console.error("getPropertySlotAvailability error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const approveBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ success: false, message: "Invalid booking ID" });
        }

        const booking = await Booking.findById(bookingId).populate("property");
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.property.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Unauthorized to approve bookings for this property" });
        }

        if (booking.status !== "pending") {
            return res.status(409).json({ success: false, message: "Booking has already been processed." });
        }

        booking.status = "booked";
        await booking.save();

        if (booking.property.rentType === "monthly") {
            await Property.findByIdAndUpdate(booking.property._id, {
                $addToSet: { tenants: booking.user }
            });
        }

        const landlordNotif = await Notification.findOne({ relatedBooking: booking._id, type: "BOOKING_CREATED" });
        if (landlordNotif) {
            landlordNotif.message = landlordNotif.message.replace(" - Approved", "").replace(" - Declined", "") + " - Approved";
            landlordNotif.status = "read";
            await landlordNotif.save();
            
            if (global.io) {
                global.io.to(req.user.id.toString()).emit("notification", {
                    _id: landlordNotif._id,
                    type: landlordNotif.type,
                    title: landlordNotif.title,
                    message: landlordNotif.message,
                    status: landlordNotif.status,
                    relatedBooking: { _id: booking._id, status: "booked" }
                });
            }
        }

        Notification.create({
            recipient: booking.user,
            type: "BOOKING_CONFIRMED",
            title: "Booking Approved",
            message: `Your booking for ${booking.property.propertyName} has been approved by the host!`,
            relatedProperty: booking.property._id,
            status: "unread"
        }).then(notif => {
            if (global.io) {
                global.io.to(booking.user.toString()).emit("notification", {
                    _id: notif._id,
                    type: notif.type,
                    title: notif.title,
                    message: notif.message,
                    status: notif.status
                });
            }
        }).catch(err => console.error("Notification failed:", err));

        return res.status(200).json({ success: true, message: "Booking approved successfully" });
    } catch (err) {
        console.error("approveBooking error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const rejectBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ success: false, message: "Invalid booking ID" });
        }

        const booking = await Booking.findById(bookingId).populate("property");
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.property.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Unauthorized to reject bookings for this property" });
        }

        if (booking.status !== "pending") {
            return res.status(409).json({ success: false, message: "Booking has already been processed." });
        }

        booking.status = "cancelled";
        await booking.save();

        const landlordNotif = await Notification.findOne({ relatedBooking: booking._id, type: "BOOKING_CREATED" });
        if (landlordNotif) {
            landlordNotif.message = landlordNotif.message.replace(" - Approved", "").replace(" - Declined", "") + " - Declined";
            landlordNotif.status = "read";
            await landlordNotif.save();
            
            if (global.io) {
                global.io.to(req.user.id.toString()).emit("notification", {
                    _id: landlordNotif._id,
                    type: landlordNotif.type,
                    title: landlordNotif.title,
                    message: landlordNotif.message,
                    status: landlordNotif.status,
                    relatedBooking: { _id: booking._id, status: "cancelled" }
                });
            }
        }

        Notification.create({
            recipient: booking.user,
            type: "BOOKING_REJECTED",
            title: "Booking Declined",
            message: `Your booking for ${booking.property.propertyName} has been declined.`,
            relatedProperty: booking.property._id,
            status: "unread"
        }).then(notif => {
            if (global.io) {
                global.io.to(booking.user.toString()).emit("notification", {
                    _id: notif._id,
                    type: notif.type,
                    title: notif.title,
                    message: notif.message,
                    status: notif.status
                });
            }
        }).catch(err => console.error("Notification failed:", err));

        return res.status(200).json({ success: true, message: "Booking rejected successfully" });
    } catch (err) {
        console.error("rejectBooking error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
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
    approveBooking,
    rejectBooking,
    approveCancellation,
    rejectCancellation
};
