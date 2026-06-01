const Property = require("../models/property");
const User = require("../models/user");


// POST /api/properties
const createProperty = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const {
            propertyName,
            propertyType,
            propertyAddress,
            city,
            state,
            pincode,
            country,
            description,
            capacity,
            amenities,
            pricePerHour,
            securityDeposit,
        } = req.body;

        const missingFields = [];
        const requiredFields = {
            propertyName,
            propertyType,
            propertyAddress,
            city,
            state,
            pincode,
            country,
            description,
            capacity,
            amenities,
            pricePerHour,
            securityDeposit,
        };

        for (const [key, value] of Object.entries(requiredFields)) {
            if (value === undefined || value === null || value === "") {
                missingFields.push(key);
            }
        }

        if (missingFields.length > 0) {
            return res.status(422).json({
                success: false,
                message: "Missing required fields",
                missingFields,
            });
        }

        const VALID_PROPERTY_TYPES = ["gym", "house", "villa", "swimmingpool", "commercial"];

        if (typeof propertyName !== "string" || propertyName.trim().length < 3 || propertyName.trim().length > 50) {
            return res.status(422).json({ success: false, message: "propertyName must be between 3 and 50 characters" });
        }

        if (!VALID_PROPERTY_TYPES.includes(propertyType)) {
            return res.status(422).json({
                success: false,
                message: `propertyType must be one of: ${VALID_PROPERTY_TYPES.join(", ")}`,
            });
        }

        if (typeof pincode !== "number" || !/^[1-9][0-9]{5}$/.test(String(pincode))) {
            return res.status(422).json({ success: false, message: "Please enter a valid 6-digit pincode" });
        }

        if (typeof capacity !== "number" || capacity < 1 || !Number.isInteger(capacity)) {
            return res.status(422).json({ success: false, message: "capacity must be a positive integer" });
        }

        if (!Array.isArray(amenities) || amenities.length === 0) {
            return res.status(422).json({ success: false, message: "amenities must be a non-empty array" });
        }

        if (typeof pricePerHour !== "number" || pricePerHour < 0) {
            return res.status(422).json({ success: false, message: "pricePerHour must be a non-negative number" });
        }

        if (typeof securityDeposit !== "number" || securityDeposit < 0) {
            return res.status(422).json({ success: false, message: "securityDeposit must be a non-negative number" });
        }

        const property = await Property.create({
            propertyName:    propertyName.trim(),
            propertyType,
            propertyAddress: propertyAddress.trim(),
            city:            city.trim(),
            state:           state.trim(),
            pincode,
            country:         country.trim(),
            description:     description.trim(),
            capacity,
            amenities,
            pricePerHour,
            securityDeposit,
            owner:           req.user.id,
        });

        return res.status(201).json({
            success: true,
            message: "Property created successfully",
            data: property,
        });

    } catch (err) {
        if (err.name === "ValidationError") {
            const errors = Object.values(err.errors).map((e) => e.message);
            return res.status(422).json({ success: false, message: "Validation failed", errors });
        }

        console.error("createProperty error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};



// PATCH /api/properties/:propertyId
const updateProperty = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { propertyId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({ success: false, message: "Invalid property ID" });
        }

        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ success: false, message: "Property not found" });
        }

        if (property.owner.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: "You are not authorized to update this property" });
        }

        const VALID_PROPERTY_TYPES = ["gym", "house", "villa", "swimmingpool", "commercial"];

        const {
            propertyName,
            propertyType,
            propertyAddress,
            city,
            state,
            pincode,
            country,
            description,
            capacity,
            amenities,
            pricePerHour,
            securityDeposit,
        } = req.body;

        if (propertyName !== undefined) {
            if (typeof propertyName !== "string" || propertyName.trim().length < 3 || propertyName.trim().length > 50) {
                return res.status(422).json({ success: false, message: "propertyName must be between 3 and 50 characters" });
            }
        }

        if (propertyType !== undefined) {
            if (!VALID_PROPERTY_TYPES.includes(propertyType)) {
                return res.status(422).json({
                    success: false,
                    message: `propertyType must be one of: ${VALID_PROPERTY_TYPES.join(", ")}`,
                });
            }
        }

        if (propertyAddress !== undefined) {
            if (typeof propertyAddress !== "string" || propertyAddress.trim().length === 0) {
                return res.status(422).json({ success: false, message: "propertyAddress cannot be empty" });
            }
        }

        if (city !== undefined) {
            if (typeof city !== "string" || city.trim().length === 0) {
                return res.status(422).json({ success: false, message: "city cannot be empty" });
            }
        }

        if (state !== undefined) {
            if (typeof state !== "string" || state.trim().length === 0) {
                return res.status(422).json({ success: false, message: "state cannot be empty" });
            }
        }

        if (pincode !== undefined) {
            if (typeof pincode !== "number" || !/^[1-9][0-9]{5}$/.test(String(pincode))) {
                return res.status(422).json({ success: false, message: "Please enter a valid 6-digit pincode" });
            }
        }

        if (country !== undefined) {
            if (typeof country !== "string" || country.trim().length === 0) {
                return res.status(422).json({ success: false, message: "country cannot be empty" });
            }
        }

        if (description !== undefined) {
            if (typeof description !== "string" || description.trim().length === 0) {
                return res.status(422).json({ success: false, message: "description cannot be empty" });
            }
        }

        if (capacity !== undefined) {
            if (typeof capacity !== "number" || capacity < 1 || !Number.isInteger(capacity)) {
                return res.status(422).json({ success: false, message: "capacity must be a positive integer" });
            }
        }

        if (amenities !== undefined) {
            if (!Array.isArray(amenities) || amenities.length === 0) {
                return res.status(422).json({ success: false, message: "amenities must be a non-empty array" });
            }
        }

        if (pricePerHour !== undefined) {
            if (typeof pricePerHour !== "number" || pricePerHour < 0) {
                return res.status(422).json({ success: false, message: "pricePerHour must be a non-negative number" });
            }
        }

        if (securityDeposit !== undefined) {
            if (typeof securityDeposit !== "number" || securityDeposit < 0) {
                return res.status(422).json({ success: false, message: "securityDeposit must be a non-negative number" });
            }
        }



        const incoming = {
            propertyName, propertyType, propertyAddress, city, state,
            pincode, country, description, capacity, amenities,
            pricePerHour, securityDeposit,
        };

        const hasUpdate = Object.values(incoming).some((v) => v !== undefined);
        if (!hasUpdate) {
            return res.status(400).json({ success: false, message: "No valid fields provided for update" });
        }

        const trimmed = (val) => (typeof val === "string" ? val.trim() : val);

        const stringFields  = ["propertyName", "propertyAddress", "city", "state", "country", "description"];
        const asIsFields    = ["propertyType", "pincode", "capacity", "amenities", "pricePerHour", "securityDeposit"];

        stringFields.forEach((field) => {
            if (incoming[field] !== undefined) property[field] = trimmed(incoming[field]);
        });

        asIsFields.forEach((field) => {
            if (incoming[field] !== undefined) property[field] = incoming[field];
        });

        await property.save();

        return res.status(200).json({
            success: true,
            message: "Property updated successfully",
            data: property,
        });

    } catch (err) {
        if (err.name === "ValidationError") {
            const errors = Object.values(err.errors).map((e) => e.message);
            return res.status(422).json({ success: false, message: "Validation failed", errors });
        }

        console.error("updateProperty error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};



// DELETE /api/properties/:propertyId
const deleteProperty = async (req, res) => {
    try {

        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }


        const { propertyId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({ success: false, message: "Invalid property ID" });
        }

        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ success: false, message: "Property not found" });
        }

        
        const isAdmin    = req.user.role === "admin";
        const isOwner    = property.owner.toString() === req.user.id.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this property",
            });
        }

        await Property.findByIdAndDelete(propertyId);

        return res.status(200).json({
            success: true,
            message: "Property deleted successfully",
        });

    } catch (err) {
        console.error("deleteProperty error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};



// GET /api/properties
const getAllProperties = async (req, res) => {
    try {
        const { city, propertyType, minPrice, maxPrice, country, state } = req.query;

        // ── 1. Build filter ───────────────────────────────────────────
        const filter = {};

        if (city)         filter.city         = new RegExp(city.trim(), "i");
        if (state)        filter.state        = new RegExp(state.trim(), "i");
        if (country)      filter.country      = new RegExp(country.trim(), "i");

        if (propertyType) {
            const VALID_TYPES = ["gym", "house", "villa", "swimmingpool", "commercial"];
            if (!VALID_TYPES.includes(propertyType)) {
                return res.status(422).json({
                    success: false,
                    message: `propertyType must be one of: ${VALID_TYPES.join(", ")}`,
                });
            }
            filter.propertyType = propertyType;
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.pricePerHour = {};
            if (minPrice !== undefined) {
                const min = Number(minPrice);
                if (isNaN(min) || min < 0) {
                    return res.status(422).json({ success: false, message: "minPrice must be a non-negative number" });
                }
                filter.pricePerHour.$gte = min;
            }
            if (maxPrice !== undefined) {
                const max = Number(maxPrice);
                if (isNaN(max) || max < 0) {
                    return res.status(422).json({ success: false, message: "maxPrice must be a non-negative number" });
                }
                filter.pricePerHour.$lte = max;
            }
            if (filter.pricePerHour.$gte !== undefined &&
                filter.pricePerHour.$lte !== undefined &&
                filter.pricePerHour.$gte > filter.pricePerHour.$lte) {
                return res.status(422).json({ success: false, message: "minPrice cannot be greater than maxPrice" });
            }
        }

        // ── 2. Query ──────────────────────────────────────────────────
        const properties = await Property.find(filter)
            .populate("owner", "firstname lastname email phoneNumber")
            .lean();

        return res.status(200).json({
            success: true,
            message: "Properties fetched successfully",
            count: properties.length,
            data: properties,
        });

    } catch (err) {
        console.error("getAllProperties error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};



// GET /api/properties/:propertyId
const getPropertyById = async (req, res) => {
    try {
        const { propertyId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({ success: false, message: "Invalid property ID" });
        }

        const property = await Property.findById(propertyId)
            .populate("owner", "firstname lastname email phoneNumber")
            .lean();

        if (!property) {
            return res.status(404).json({ success: false, message: "Property not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Property fetched successfully",
            data: property,
        });

    } catch (err) {
        console.error("getPropertyById error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};




module.exports = {
    createProperty,
    updateProperty,
    deleteProperty,
    getAllProperties,
    getPropertyById,
    addTenantToProperty,
    removeTenantFromProperty,
    getTenantsOfProperty
};
