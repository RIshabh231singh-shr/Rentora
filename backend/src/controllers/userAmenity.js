const mongoose = require("mongoose");
const Amenity = require("../models/amenity");
const Booking = require("../models/booking");
const Property = require("../models/property");


// POST /api/amenities
const createAmenity = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { name, description, property, capacity, openingTime, closingTime, slotDuration,
                category, pricePerHour, openingHour, closingHour } = req.body;

        if (!name || !property || !capacity) {
            return res.status(422).json({
                success: false,
                message: "Missing required fields: name, property, capacity"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(property)) {
            return res.status(400).json({ success: false, message: "Invalid property ID" });
        }

        const propertyDoc = await Property.findById(property).select("owner").lean();
        if (!propertyDoc) {
            return res.status(404).json({ success: false, message: "Property not found" });
        }

        const isOwner = propertyDoc.owner.toString() === req.user.id.toString();
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Only the property owner or admin can create amenities" });
        }

        const capNum = Number(capacity);
        if (isNaN(capNum) || capNum < 1 || !Number.isInteger(capNum)) {
            return res.status(422).json({ success: false, message: "capacity must be a positive integer" });
        }

        // Resolve openingHour / closingHour (prefer integer fields, fall back to Date parsing)
        let openHour = openingHour !== undefined ? Number(openingHour) : null;
        let closeHour = closingHour !== undefined ? Number(closingHour) : null;

        if (openHour === null && openingTime) openHour = new Date(openingTime).getHours();
        if (closeHour === null && closingTime) closeHour = new Date(closingTime).getHours();

        // Legacy Date fields for backward compat
        let openDate = openingTime ? new Date(openingTime) : null;
        let closeDate = closingTime ? new Date(closingTime) : null;
        if (!openDate && openHour !== null) {
            openDate = new Date(); openDate.setHours(openHour, 0, 0, 0);
        }
        if (!closeDate && closeHour !== null) {
            closeDate = new Date(); closeDate.setHours(closeHour, 0, 0, 0);
        }

        const amenity = await Amenity.create({
            name: name.trim(),
            description: description?.trim() || "",
            property,
            capacity: capNum,
            category: category?.trim() || "general",
            pricePerHour: pricePerHour !== undefined ? Number(pricePerHour) : 0,
            openingHour: openHour ?? 6,
            closingHour: closeHour ?? 22,
            openingTime: openDate,
            closingTime: closeDate,
            slotDuration: slotDuration || 1,
            isActive: true,
        });

        return res.status(201).json({
            success: true,
            message: "Amenity created successfully",
            data: amenity,
        });

    } catch (err) {
        if (err.name === "ValidationError") {
            const errors = Object.values(err.errors).map((e) => e.message);
            return res.status(422).json({ success: false, message: "Validation failed", errors });
        }
        console.error("createAmenity error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


// GET /api/amenities
// Returns amenities for a specific property OR all amenities accessible to the user
const getAmenities = async (req, res) => {
    try {
        const { propertyId } = req.query;
        let filter = { isActive: true };

        if (req.user.role === "tenant") {
            const tenantProperties = await Property.find({ tenants: req.user.id || req.user._id }).select("_id").lean();
            const tenantPropIds = tenantProperties.map(p => p._id.toString());
            
            if (propertyId) {
                if (!mongoose.Types.ObjectId.isValid(propertyId)) {
                    return res.status(400).json({ success: false, message: "Invalid property ID" });
                }
                if (!tenantPropIds.includes(propertyId)) {
                    return res.status(403).json({ success: false, message: "You are not a tenant of this property" });
                }
                filter.property = propertyId;
            } else {
                filter.property = { $in: tenantPropIds };
            }
        } else {
            if (propertyId) {
                if (!mongoose.Types.ObjectId.isValid(propertyId)) {
                    return res.status(400).json({ success: false, message: "Invalid property ID" });
                }
                filter.property = propertyId;
            }
        }

        const amenities = await Amenity.find(filter)
            .populate("property", "propertyName propertyAddress")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json(amenities);

    } catch (err) {
        console.error("getAmenities error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


// GET /api/amenities/:amenityId
const getAmenityById = async (req, res) => {
    try {
        const { amenityId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(amenityId)) {
            return res.status(400).json({ success: false, message: "Invalid amenity ID" });
        }

        const amenity = await Amenity.findById(amenityId)
            .populate("property", "propertyName propertyAddress owner tenants")
            .lean();

        if (!amenity) {
            return res.status(404).json({ success: false, message: "Amenity not found" });
        }

        if (req.user.role === "tenant") {
            const userId = req.user.id || req.user._id;
            const isTenant = amenity.property?.tenants?.some(t => t.toString() === userId.toString());
            if (!isTenant) {
                return res.status(403).json({ success: false, message: "Unauthorized to view this amenity" });
            }
        }

        return res.status(200).json({ success: true, data: amenity });

    } catch (err) {
        console.error("getAmenityById error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


// PATCH /api/amenities/:amenityId
const updateAmenity = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { amenityId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(amenityId)) {
            return res.status(400).json({ success: false, message: "Invalid amenity ID" });
        }

        const amenity = await Amenity.findById(amenityId).populate("property", "owner");
        if (!amenity) {
            return res.status(404).json({ success: false, message: "Amenity not found" });
        }

        const isOwner = amenity.property?.owner?.toString() === req.user.id.toString();
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Unauthorized to update this amenity" });
        }

        const { name, description, capacity, openingTime, closingTime, slotDuration, isActive,
                category, pricePerHour, openingHour, closingHour } = req.body;

        if (name !== undefined) amenity.name = name.trim();
        if (description !== undefined) amenity.description = description.trim();
        if (category !== undefined) amenity.category = category.trim();
        if (pricePerHour !== undefined) amenity.pricePerHour = Number(pricePerHour);
        if (capacity !== undefined) {
            const capNum = Number(capacity);
            if (isNaN(capNum) || capNum < 1) {
                return res.status(422).json({ success: false, message: "capacity must be a positive integer" });
            }
            amenity.capacity = capNum;
        }
        if (openingHour !== undefined) amenity.openingHour = Number(openingHour);
        if (closingHour !== undefined) amenity.closingHour = Number(closingHour);
        if (openingTime !== undefined) amenity.openingTime = new Date(openingTime);
        if (closingTime !== undefined) amenity.closingTime = new Date(closingTime);
        if (slotDuration !== undefined) amenity.slotDuration = slotDuration;
        if (isActive !== undefined) amenity.isActive = isActive;

        await amenity.save();

        return res.status(200).json({
            success: true,
            message: "Amenity updated successfully",
            data: amenity,
        });

    } catch (err) {
        console.error("updateAmenity error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


// DELETE /api/amenities/:amenityId
const deleteAmenity = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { amenityId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(amenityId)) {
            return res.status(400).json({ success: false, message: "Invalid amenity ID" });
        }

        const amenity = await Amenity.findById(amenityId).populate("property", "owner");
        if (!amenity) {
            return res.status(404).json({ success: false, message: "Amenity not found" });
        }

        const isOwner = amenity.property?.owner?.toString() === req.user.id.toString();
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Unauthorized to delete this amenity" });
        }

        // Cancel all future bookings for this amenity
        const now = new Date();
        await Booking.updateMany(
            { amenity: amenityId, bookingStartTime: { $gte: now }, status: "booked" },
            { $set: { status: "cancelled" } }
        );

        await Amenity.findByIdAndDelete(amenityId);

        return res.status(200).json({
            success: true,
            message: "Amenity deleted and future bookings cancelled",
        });

    } catch (err) {
        console.error("deleteAmenity error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


module.exports = {
    // Amenity CRUD
    createAmenity,
    getAmenities,
    getAmenityById,
    updateAmenity,
    deleteAmenity,
};
