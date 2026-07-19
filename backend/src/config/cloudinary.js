const cloudinary = require("cloudinary").v2;

if (process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_KEY && process.env.CLOUDINARY_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_KEY,
        api_secret: process.env.CLOUDINARY_SECRET
    });
    console.log("Cloudinary configured successfully.");
} else {
    console.warn("WARNING: Cloudinary credentials are not fully set in environment variables. Image uploads will fallback to placeholder images.");
}

module.exports = cloudinary;
