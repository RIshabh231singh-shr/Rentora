const MaintenanceRequest = require("../models/maintainanceRequest");
const Property = require("../models/property");
const Booking = require("../models/booking");
const Notification = require("../models/notification");
const cloudinary = require("../config/cloudinary");

// Helper to stream file buffer to Cloudinary
const uploadStream = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "rentora_maintenance" },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(fileBuffer);
    });
};

const createRequest = async (req, res) => {
    try {
        const mongoose = require("mongoose");
        const { title, category, description, propertyId } = req.body;

        if (!title || !category || !description) {
            return res.status(400).json({ message: "Title, category and description are required fields." });
        }

        if (title.length < 5 || title.length > 100) {
            return res.status(400).json({ message: "Title must be between 5 and 100 characters." });
        }

        if (description.length < 10 || description.length > 1000) {
            return res.status(400).json({ message: "Description must be between 10 and 1000 characters." });
        }

        const validCategories = ["plumbing", "electrical", "cleaning", "others"];
        if (!validCategories.includes(category.toLowerCase())) {
            return res.status(400).json({ message: `Invalid category. Must be one of: ${validCategories.join(", ")}` });
        }

        if (!propertyId) {
            return res.status(400).json({ message: "Property ID is required to submit a maintenance request." });
        }

        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({ message: "Invalid property ID." });
        }
        
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: "Property not found." });
        }
        
        const isTenant = property.tenants.some(t => t.toString() === req.user._id.toString());
        
        const hasBooking = await Booking.findOne({
            user: req.user._id,
            property: propertyId,
            status: { $in: ["booked", "checked_in", "completed"] }
        });

        if (!isTenant && !hasBooking) {
            return res.status(403).json({
                message: "You are not authorized to submit maintenance requests for this property."
            });
        }

        let imageUrls = [];

        // Upload to Cloudinary if file exists
        if (req.file) {
            const hasCloudinaryCredentials = process.env.CLOUDINARY_NAME && 
                                             process.env.CLOUDINARY_KEY && 
                                             process.env.CLOUDINARY_SECRET;
            if (hasCloudinaryCredentials) {
                try {
                    const secureUrl = await uploadStream(req.file.buffer);
                    imageUrls.push(secureUrl);
                } catch (uploadErr) {
                    console.error("Cloudinary upload failed:", uploadErr);
                    return res.status(500).json({ message: "Failed to upload attachment to Cloudinary." });
                }
            } else {
                console.warn("Cloudinary credentials missing, using placeholder image fallback.");
                // Use a high-quality maintenance fallback image URL
                imageUrls.push("https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=600&q=80");
            }
        }

        const newMaintenanceRequest = new MaintenanceRequest({
            user: req.user._id,
            property: property._id,
            title,
            description,
            category: category.toLowerCase(),
            images: imageUrls,
            status: "pending"
        });

        const savedRequest = await newMaintenanceRequest.save();

        res.status(201).json({
            message: "Maintenance request created successfully.",
            data: savedRequest
        });
    } catch (err) {
        console.error("createRequest error:", err);
        res.status(500).json({ message: "An error occurred while creating maintenance request." });
    }
};

const getRequests = async (req, res) => {
    try {
        let requests = [];

        if (req.user.role === "tenant") {
            // Tenants see their own requests
            requests = await MaintenanceRequest.find({ user: req.user._id })
                .populate("user", "firstname lastname email phoneNumber")
                .populate("property", "propertyName propertyAddress city state")
                .sort({ createdAt: -1 });
        } else if (req.user.role === "landlord") {
            // Landlords see all requests for properties they own
            const landlordProperties = await Property.find({ owner: req.user._id }).select("_id");
            const propertyIds = landlordProperties.map(p => p._id);

            requests = await MaintenanceRequest.find({ property: { $in: propertyIds } })
                .populate("user", "firstname lastname email phoneNumber")
                .populate("property", "propertyName propertyAddress city state")
                .sort({ createdAt: -1 });
        } else if (req.user.role === "admin") {
            // Admins see all requests
            requests = await MaintenanceRequest.find()
                .populate("user", "firstname lastname email phoneNumber")
                .populate("property", "propertyName propertyAddress city state")
                .sort({ createdAt: -1 });
        } else {
            return res.status(403).json({ message: "Access forbidden." });
        }

        res.status(200).json(requests);
    } catch (err) {
        console.error("getRequests error:", err);
        res.status(500).json({ message: "An error occurred while fetching maintenance requests." });
    }
};

const updateRequestStatus = async (req, res) => {
    try {
        const mongoose = require("mongoose");
        const { requestId } = req.params;
        const { status, resolutionNotes } = req.body;

        const validStatuses = ["assigned", "in_progress", "resolved", "cancelled"];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(", ")}` });
        }

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ message: "Invalid request ID" });
        }

        const request = await MaintenanceRequest.findById(requestId)
            .populate("property", "owner propertyName")
            .populate("user", "_id firstname lastname email");

        if (!request) {
            return res.status(404).json({ message: "Maintenance request not found" });
        }

        // Only landlord of that property or admin can update
        const isOwner = request.property?.owner?.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: "You are not authorized to update this request" });
        }

        request.status = status;
        if (resolutionNotes) request.resolutionNotes = resolutionNotes;
        if (status === "resolved") {
            request.resolvedAt = new Date();
            request.resolvedBy = req.user._id;
        }
        await request.save();

        const statusLabels = {
            assigned: "Assigned",
            in_progress: "In Progress",
            resolved: "Resolved",
            cancelled: "Cancelled"
        };

        // Notify tenant in DB
        const notifType = status === "resolved" ? "MAINTENANCE_RESOLVED" : "MAINTENANCE_STATUS_CHANGED";
        Notification.create({
            recipient: request.user._id,
            type: notifType,
            title: `Maintenance ${statusLabels[status]}`,
            message: `Your maintenance request "${request.title}" has been marked as ${statusLabels[status]}.${
                resolutionNotes ? ` Note: ${resolutionNotes}` : ""
            }`,
            relatedProperty: request.property._id,
            status: "unread"
        }).catch(err => console.error("Maintenance notification failed:", err));

        // Real-time WebSocket push to tenant
        if (global.io) {
            global.io.to(request.user._id.toString()).emit("notification", {
                type: notifType,
                title: `Maintenance ${statusLabels[status]}`,
                message: `Your request "${request.title}" is now ${statusLabels[status]}.`
            });
        }

        return res.status(200).json({
            success: true,
            message: `Status updated to ${statusLabels[status]}`,
            data: request
        });
    } catch (err) {
        console.error("updateRequestStatus error:", err);
        res.status(500).json({ message: "An error occurred while updating request status." });
    }
};

const assignStaff = async (req, res) => {
    try {
        const mongoose = require("mongoose");
        const { requestId } = req.params;
        const { staffId, notes } = req.body;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ message: "Invalid request ID" });
        }
        if (staffId && !mongoose.Types.ObjectId.isValid(staffId)) {
            return res.status(400).json({ message: "Invalid staff ID" });
        }

        const request = await MaintenanceRequest.findById(requestId)
            .populate("property", "owner propertyName")
            .populate("user", "_id firstname lastname");

        if (!request) {
            return res.status(404).json({ message: "Maintenance request not found" });
        }

        const isOwner = request.property?.owner?.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: "Not authorized to assign staff" });
        }

        if (staffId) {
            const User = require("../models/user");
            const staff = await User.findById(staffId).select("firstname lastname role");
            if (!staff) return res.status(404).json({ message: "Staff member not found" });
            request.assignedStaff = staffId;
        } else {
            request.assignedStaff = null;
        }

        if (request.status === "pending") request.status = "assigned";
        if (notes) request.resolutionNotes = notes;
        await request.save();

        // Real-time push to tenant
        if (global.io) {
            global.io.to(request.user._id.toString()).emit("notification", {
                type: "MAINTENANCE_STATUS_CHANGED",
                title: "Staff Assigned",
                message: `A staff member has been assigned to your request "${request.title}".`
            });
        }

        return res.status(200).json({
            success: true,
            message: staffId ? "Staff assigned successfully" : "Staff assignment cleared",
            data: request
        });
    } catch (err) {
        console.error("assignStaff error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const getMaintenanceKPIs = async (req, res) => {
    try {
        const userId = req.user._id;
        const role = req.user.role;

        let filter = {};
        if (role === "tenant") {
            filter.user = userId;
        } else if (role === "landlord") {
            const properties = await Property.find({ owner: userId }).select("_id");
            filter.property = { $in: properties.map(p => p._id) };
        }
        // admin: no filter (all requests)

        const total = await MaintenanceRequest.countDocuments(filter);
        const resolved = await MaintenanceRequest.countDocuments({ ...filter, status: "resolved" });
        const pending = await MaintenanceRequest.countDocuments({ ...filter, status: "pending" });
        const inProgress = await MaintenanceRequest.countDocuments({ ...filter, status: { $in: ["assigned", "in_progress"] } });

        // Average resolution time (only for resolved requests that have resolvedAt)
        const resolvedRequests = await MaintenanceRequest.find({
            ...filter,
            status: "resolved",
            resolvedAt: { $exists: true, $ne: null }
        }).select("createdAt resolvedAt").lean();

        let avgResolutionHours = null;
        if (resolvedRequests.length > 0) {
            const totalMs = resolvedRequests.reduce((sum, r) => {
                return sum + (new Date(r.resolvedAt) - new Date(r.createdAt));
            }, 0);
            avgResolutionHours = Math.round((totalMs / resolvedRequests.length) / (1000 * 60 * 60) * 10) / 10;
        }

        const completionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
        const meetsSLA = avgResolutionHours !== null ? avgResolutionHours <= 48 : null;

        return res.status(200).json({
            success: true,
            data: {
                total,
                resolved,
                pending,
                inProgress,
                completionRate,
                avgResolutionHours,
                meetsSLA,
                slaTarget: 48
            }
        });
    } catch (err) {
        console.error("getMaintenanceKPIs error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// POST /api/maintenance/:id/review
const submitReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, feedback } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Valid rating between 1 and 5 is required." });
        }

        const request = await MaintenanceRequest.findById(id).populate("property");
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });

        // Only the tenant who requested it (or the property tenant) can review
        if (request.tenant.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized to review this request." });
        }

        if (request.status !== "resolved") {
            return res.status(400).json({ success: false, message: "Can only review resolved requests." });
        }

        request.rating = rating;
        if (feedback) request.feedback = feedback.trim();

        await request.save();

        return res.status(200).json({ success: true, message: "Review submitted successfully.", data: request });
    } catch (err) {
        console.error("submitReview error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    createRequest,
    getRequests,
    updateRequestStatus,
    assignStaff,
    getMaintenanceKPIs,
    submitReview
};
