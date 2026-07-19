const mongoose = require("mongoose");
const Property = require("../models/property");
const User = require("../models/user");
const Notification = require("../models/notification");
const cloudinary = require("../config/cloudinary");

// Helper to stream file buffer to Cloudinary
const uploadStream = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "rentora_properties" },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(fileBuffer);
    });
};


// POST /api/properties
const createProperty = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        let {
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

        // Parse fields sent via FormData multipart
        if (pincode !== undefined && pincode !== "") pincode = Number(pincode);
        if (capacity !== undefined && capacity !== "") capacity = Number(capacity);
        if (pricePerHour !== undefined && pricePerHour !== "") pricePerHour = Number(pricePerHour);
        if (securityDeposit !== undefined && securityDeposit !== "") securityDeposit = Number(securityDeposit);

        if (typeof amenities === "string") {
            try {
                amenities = JSON.parse(amenities);
            } catch (e) {
                // Split by comma
                amenities = amenities.split(",").map(a => a.trim()).filter(Boolean);
            }
        }

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

        const VALID_PROPERTY_TYPES = ["gym", "house", "villa", "swimmingpool", "commercial", "other"];

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

        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            const hasCloudinaryCredentials = process.env.CLOUDINARY_NAME && 
                                             process.env.CLOUDINARY_KEY && 
                                             process.env.CLOUDINARY_SECRET;
            if (hasCloudinaryCredentials) {
                try {
                    const uploadPromises = req.files.map(file => uploadStream(file.buffer));
                    const secureUrls = await Promise.all(uploadPromises);
                    imageUrls = secureUrls;
                } catch (uploadErr) {
                    console.error("Cloudinary property upload failed:", uploadErr);
                    return res.status(500).json({ success: false, message: "Failed to upload property images to Cloudinary" });
                }
            } else {
                console.warn("Cloudinary credentials missing, using placeholder image fallback.");
                imageUrls.push("https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80");
            }
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
            images:          imageUrls,
            owner:           req.user.id,
        });

        // Add property to owner's myProperties list
        await User.findByIdAndUpdate(req.user.id, {
            $addToSet: { myProperties: property._id }
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
        const { city, propertyType, minPrice, maxPrice, country, state, myProperties } = req.query;

        // ── 1. Build filter ───────────────────────────────────────────
        const filter = {};

        if (myProperties === "true" && req.user?.id) {
            filter.owner = req.user.id;
        }

        if (city)         filter.city         = new RegExp(city.trim(), "i");
        if (state)        filter.state        = new RegExp(state.trim(), "i");
        if (country)      filter.country      = new RegExp(country.trim(), "i");

        if (propertyType) {
            const VALID_TYPES = ["gym", "house", "villa", "swimmingpool", "commercial", "other"];
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



// POST /api/properties/:propertyId/tenants
// Controller function
const addTenantToProperty = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { propertyId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({ success: false, message: "Invalid property ID" });
        }

        const requesterId = req.user.id.toString();
        const requesterRole = req.user.role;

        let tenantId;
        if (requesterRole === "tenant") {
            tenantId = requesterId;
        } else {
            if (!req.body.tenantId) {
                return res.status(400).json({ 
                    success: false, 
                    message: "tenantId is required for landlords and admins" 
                });
            }
            tenantId = req.body.tenantId.toString();
        }

        if (!mongoose.Types.ObjectId.isValid(tenantId)) {
            return res.status(400).json({ success: false, message: "Invalid tenant ID" });
        }

        // Fetch property with lean for better performance
        const property = await Property.findById(propertyId).lean();
        if (!property) {
            return res.status(404).json({ success: false, message: "Property not found" });
        }

        const alreadyTenant = property.tenants?.some(id => id.toString() === tenantId);
        if (alreadyTenant) {
            return res.status(400).json({ success: false, message: "User is already a tenant" });
        }

        const hasPendingRequest = property.pendingTenants?.some(id => id.toString() === tenantId);
        if (hasPendingRequest) {
            return res.status(400).json({
                success: false,
                message: "User already has a pending request for this property"
            });
        }

        const user = await User.findById(tenantId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.role !== "tenant" && user.role !== "landlord") {
            return res.status(400).json({
                success: false,
                message: `User with role '${user.role}' cannot request to rent a property`
            });
        }

        const isSelfRequest = tenantId === requesterId && (requesterRole === "tenant" || requesterRole === "landlord");
        const isLandlord = property.owner.toString() === requesterId;
        const isAdmin = requesterRole === "admin";

        // Case 1: Tenant/Landlord self-request
        if (isSelfRequest) {
            // Block owner from booking their own property
            if (property.owner.toString() === requesterId) {
                return res.status(400).json({
                    success: false,
                    message: "You cannot request to rent/book your own property."
                });
            }

            // Check capacity before allowing pending request
            if (property.tenants.length >= property.capacity) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot request: Property is at full capacity (${property.tenants.length}/${property.capacity})`
                });
            }

            const updatedProperty = await Property.findByIdAndUpdate(
                propertyId,
                {
                    $addToSet: { pendingTenants: tenantId }  // $addToSet prevents duplicates
                },
                { new: true }
            );

            // Fire notification without awaiting to prevent blocking
            Notification.create({
                recipient: property.owner,
                type: "TENANT_REQUEST",
                title: "New Tenant Request",
                message: `${user.name || user.email} has requested to join ${property.propertyAddress}`,
                relatedProperty: propertyId,
                relatedUser: tenantId,
                status: "unread"
            }).then(() => {
                if (global.io) {
                    global.io.to(property.owner.toString()).emit("notification", {
                        type: "TENANT_REQUEST",
                        title: "New Tenant Request",
                        message: `${user.name || user.email} has requested to join ${property.propertyAddress}`,
                        relatedProperty: propertyId,
                        relatedUser: tenantId
                    });
                }
            }).catch(err => console.error("Notification failed:", err));

            return res.status(200).json({
                success: true,
                message: "Join request sent for approval",
                data: {
                    propertyId,
                    tenantId,
                    status: "pending",
                    currentOccupancy: property.tenants.length,
                    capacity: property.capacity
                }
            });
        }

        // Case 2: Landlord/Admin direct add
        if (isLandlord || isAdmin) {
            const updated = await Property.findOneAndUpdate(
                {
                    _id: propertyId,
                    $expr: { $lt: [{ $size: "$tenants" }, "$capacity" ] }
                },
                {
                    $push: { tenants: tenantId },
                    $pull: { pendingTenants: tenantId }
                },
                { new: true }
            );

            if (!updated) {
                return res.status(400).json({
                    success: false,
                    message: `Property at capacity (${property.tenants.length}/${property.capacity})`
                });
            }

            Notification.create({
                recipient: tenantId,
                type: "TENANT_ADDED",
                title: "Added to Property",
                message: `You have been added to ${property.propertyAddress}`,
                relatedProperty: propertyId,
                relatedUser: req.user.id,
                status: "unread"
            }).catch(err => console.error("Notification failed:", err));

            return res.status(200).json({
                success: true,
                message: "Tenant added successfully",
                data: {
                    tenantId,
                    propertyId,
                    totalTenants: updated.tenants.length,
                    availableSpots: property.capacity - updated.tenants.length
                }
            });
        }

        return res.status(403).json({
            success: false,
            message: "Unauthorized to add tenants to this property"
        });

    } catch (err) {
        console.error("addTenantToProperty error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// New controller function: Accept tenant request
const acceptTenantRequest = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { propertyId, tenantId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(propertyId) || !mongoose.Types.ObjectId.isValid(tenantId)) {
            return res.status(400).json({ success: false, message: "Invalid ID format" });
        }

        // Atomic update - prevents race conditions
        const updated = await Property.findOneAndUpdate(
            {
                _id: propertyId,
                pendingTenants: tenantId,
                $expr: { $lt: [{ $size: "$tenants" }, "$capacity" ] }
            },
            {
                $push: { tenants: tenantId },
                $pull: { pendingTenants: tenantId }
            },
            { new: true }
        );

        if (!updated) {
            // Check why it failed for better error message
            const property = await Property.findById(propertyId).select('pendingTenants tenants capacity');
            if (!property) {
                return res.status(404).json({ success: false, message: "Property not found" });
            }
            
            const isPending = property.pendingTenants?.some(id => id.toString() === tenantId);
            const hasCapacity = property.tenants.length < property.capacity;
            
            if (!isPending) {
                return res.status(400).json({ 
                    success: false, 
                    message: "No pending request found for this tenant" 
                });
            }
            if (!hasCapacity) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Property at capacity (${property.tenants.length}/${property.capacity})` 
                });
            }
            return res.status(400).json({ 
                success: false, 
                message: "Unable to accept tenant request" 
            });
        }

        // Fire notification asynchronously
        Notification.create({
            recipient: tenantId,
            type: "TENANT_REQUEST_ACCEPTED",
            title: "Tenant Request Accepted",
            message: `Your request to join ${updated.propertyAddress} has been accepted!`,
            relatedProperty: propertyId,
            relatedUser: req.user.id,
            status: "unread"
        }).catch(err => console.error("Acceptance notification failed:", err));

        // Log for audit trail
        console.log(`Tenant ${tenantId} accepted to property ${propertyId} by ${req.user.id} (${req.user.role})`);

        return res.status(200).json({
            success: true,
            message: "Tenant request accepted successfully",
            data: {
                tenantId,
                propertyId,
                totalTenants: updated.tenants.length,
                availableSpots: updated.capacity - updated.tenants.length,
                pendingRemaining: updated.pendingTenants?.length || 0
            }
        });

    } catch (err) {
        console.error("acceptTenantRequest error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// New controller function: Reject tenant request
const rejectTenantRequest = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { propertyId, tenantId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(propertyId) || !mongoose.Types.ObjectId.isValid(tenantId)) {
            return res.status(400).json({ success: false, message: "Invalid ID format" });
        }

        // Atomic update - prevents race conditions
        const updated = await Property.findOneAndUpdate(
            {
                _id: propertyId,
                pendingTenants: tenantId
            },
            {
                $pull: { pendingTenants: tenantId }
            },
            { new: true }
        );

        if (!updated) {
            const property = await Property.findById(propertyId).select('pendingTenants');
            if (!property) {
                return res.status(404).json({ success: false, message: "Property not found" });
            }
            
            const hasPendingRequest = property.pendingTenants?.some(id => id.toString() === tenantId);
            if (!hasPendingRequest) {
                return res.status(400).json({ 
                    success: false, 
                    message: "No pending request found for this tenant" 
                });
            }
            
            return res.status(400).json({ 
                success: false, 
                message: "Unable to reject tenant request" 
            });
        }

        // Verify authorization
        const isLandlord = updated.owner.toString() === req.user.id.toString();
        const isAdmin = req.user.role === "admin";

        if (!isLandlord && !isAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: "Only property owner or admin can reject tenant requests" 
            });
        }

        // Send notification (fire and forget)
        Notification.create({
            recipient: tenantId,
            type: "TENANT_REQUEST_REJECTED",
            title: "Tenant Request Declined",
            message: `Your request to join ${updated.propertyAddress} was declined by the landlord.`,
            relatedProperty: propertyId,
            relatedUser: req.user.id,
            status: "unread"
        }).catch(err => console.error("Rejection notification failed:", err));

        // Audit log
        console.log(`Tenant ${tenantId} rejected from property ${propertyId} by ${req.user.id} (${req.user.role})`);

        return res.status(200).json({
            success: true,
            message: "Tenant request rejected successfully",
            data: {
                tenantId,
                propertyId,
                rejectedAt: new Date().toISOString(),
                rejectedBy: {
                    id: req.user.id,
                    role: req.user.role
                }
            }
        });

    } catch (err) {
        console.error("rejectTenantRequest error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Get pending requests for a landlord
const getPendingTenantRequests = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 per page
        const skip = (page - 1) * limit;

        // Build query based on user role
        let query = { pendingTenants: { $exists: true, $ne: [] } };
        if (req.user.role !== "admin") {
            query.owner = req.user.id;
        }

        // Get total count for pagination
        const totalProperties = await Property.countDocuments(query);

        // Fetch properties with pagination
        const properties = await Property.find(query)
            .select('_id propertyAddress pendingTenants owner')
            .populate('pendingTenants', 'firstname lastname email phoneNumber createdAt')
            .sort({ updatedAt: -1 }) // Most recently updated first
            .skip(skip)
            .limit(limit)
            .lean();

        // Format the response
        const pendingRequests = properties.map(property => ({
            propertyId: property._id,
            propertyAddress: property.propertyAddress,
            ...(req.user.role === "admin" && { ownerId: property.owner }),
            pendingTenants: property.pendingTenants.map(tenant => ({
                id: tenant._id,
                name: `${tenant.firstname || ''} ${tenant.lastname || ''}`.trim() || tenant.email,
                email: tenant.email,
                phone: tenant.phoneNumber,
                requestedAt: tenant.createdAt || tenant.requestedAt
            })),
            pendingCount: property.pendingTenants.length
        }));

        // Return response with pagination metadata
        return res.status(200).json({
            success: true,
            data: pendingRequests,
            pagination: {
                currentPage: page,
                pageSize: limit,
                totalPages: Math.ceil(totalProperties / limit),
                totalProperties,
                hasNextPage: skip + limit < totalProperties,
                hasPrevPage: page > 1
            }
        });

    } catch (err) {
        console.error("getPendingTenantRequests error:", err);
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};



// DELETE /api/properties/:propertyId/tenants/:tenantId
const removeTenantFromProperty = async (req, res) => {
    try {

        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { propertyId, tenantId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({ success: false, message: "Invalid property ID" });
        }
        if (!mongoose.Types.ObjectId.isValid(tenantId)) {
            return res.status(400).json({ success: false, message: "Invalid tenant ID" });
        }

        const property = await Property.findById(propertyId).select('owner propertyAddress tenants pendingTenants');
        if (!property) {
            return res.status(404).json({ success: false, message: "Property not found" });
        }

        const requesterId   = req.user.id.toString();
        const isAdmin       = req.user.role === "admin";
        const isOwner       = property.owner.toString() === requesterId;
        const isSelfRemoval = requesterId === tenantId.toString() && req.user.role === "tenant";

        if (!isAdmin && !isOwner && !isSelfRemoval) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to remove this tenant"
            });
        }

        const updated = await Property.findOneAndUpdate(
            {
                _id: propertyId,
                tenants: tenantId
            },
            {
                $pull: {
                    tenants: tenantId,
                    pendingTenants: tenantId
                }
            },
            { new: true }
        );

        if (!updated) {
            return res.status(400).json({
                success: false,
                message: "User is not a tenant of this property"
            });
        }

        const removedAt = new Date().toISOString();

        const removalMessage = isSelfRemoval
            ? `You have been removed from ${updated.propertyAddress} by your own request.`
            : isOwner
                ? `You have been removed from ${updated.propertyAddress} by the property owner.`
                : isAdmin
                    ? `You have been removed from ${updated.propertyAddress} by an administrator.`
                    : `You have been removed from ${updated.propertyAddress}.`; // unreachable, but safe

        // Fire-and-forget — intentionally not awaited.
        Notification.create({
            recipient:       tenantId,
            type:            "TENANT_REMOVED",
            title:           "Removed from Property",
            message:         removalMessage,
            relatedProperty: propertyId,
            relatedUser:     requesterId,
            status:          "unread"
        }).catch(err =>
            console.error(JSON.stringify({
                event:      "NOTIFICATION_FAILED",
                type:       "TENANT_REMOVED",
                actorId:    requesterId,
                tenantId,
                propertyId,
                error:      err.message
            }))
        );

        return res.status(200).json({
            success: true,
            message: "Tenant removed successfully",
            data: {
                tenantId,
                propertyId,
                totalTenants: updated.tenants.length,
                removedBy: {
                    id:   requesterId,
                    role: req.user.role,
                    type: isSelfRemoval ? "SELF" : isOwner ? "LANDLORD" : "ADMIN"
                },
                removedAt
            }
        });

    } catch (err) {
        console.error("removeTenantFromProperty error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


// GET /api/properties/:propertyId/tenants
const getTenantsOfProperty = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { propertyId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({ success: false, message: "Invalid property ID" });
        }

        const property = await Property.findById(propertyId)
            .populate("tenants", "firstname lastname email phoneNumber profilePicture")
            .lean();

        if (!property) {
            return res.status(404).json({ success: false, message: "Property not found" });
        }

        const isAdmin = req.user.role === "admin";
        const isOwner = property.owner.toString() === req.user.id.toString();

        const isTenant = property.tenants.some(
            t => (t._id ?? t).toString() === req.user.id.toString()
        );

        if (!isAdmin && !isOwner && !isTenant) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view tenants of this property"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Tenants retrieved successfully",
            data: {
                count: property.tenants.length,
                tenants: property.tenants,
            },
        });

    } catch (err) {
        console.error("getTenantsOfProperty error:", err);
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
    getTenantsOfProperty,
    acceptTenantRequest,
    rejectTenantRequest,
    getPendingTenantRequests
};
