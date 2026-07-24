const cloudinary = require("cloudinary").v2;
const env = require("./env");

if (env.cloudinary.name && env.cloudinary.key && env.cloudinary.secret) {
    cloudinary.config({
        cloud_name: env.cloudinary.name,
        api_key: env.cloudinary.key,
        api_secret: env.cloudinary.secret
    });
    console.log("Cloudinary configured successfully.");
} else {
    console.warn("WARNING: Cloudinary credentials are not fully set in environment variables. Image uploads will fallback to placeholder images.");
}

module.exports = cloudinary;

