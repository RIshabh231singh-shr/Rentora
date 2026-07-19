const MaintenanceRequest = require("../models/maintainanceRequest");
const Property = require("../models/property");
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
        const { title, category, description } = req.body;

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

        // Find the property where this user is listed as a tenant
        const property = await Property.findOne({ tenants: req.user._id });
        if (!property) {
            return res.status(400).json({
                message: "You must be registered as a tenant in a property to submit a maintenance request."
            });
        }

        let imageUrls = [];

        // Upload to Cloudinary if file exists
        if (req.file) {
            const hasCloudinaryCredentials = process.env.CLOUDINARY_CLOUD_NAME && 
                                             process.env.CLOUDINARY_API_KEY && 
                                             process.env.CLOUDINARY_API_SECRET;
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

module.exports = {
    createRequest,
    getRequests
};
