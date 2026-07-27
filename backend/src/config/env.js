require("dotenv").config();

module.exports = {
    port: process.env.PORT || 5000,
    dbConnectionString: process.env.DB_CONNECT_STRING,
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASS,
    },
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    email: {
        service: process.env.EMAIL_SERVICE || "gmail",
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    cloudinary: {
        name: process.env.CLOUDINARY_NAME,
        key: process.env.CLOUDINARY_KEY,
        secret: process.env.CLOUDINARY_SECRET,
    },
    clientOrigin: process.env.CLIENT_ORIGIN || "https://rentora231.netlify.app",
};
