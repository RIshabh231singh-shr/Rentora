const redisClient = require("../config/redis");

const clearDashboardCache = async (userId) => {
    try {
        if (redisClient.isOpen) {
            if (userId) {
                await redisClient.del(`dashboard_${userId.toString()}`);
            }
        }
    } catch (err) {
        console.error("clearDashboardCache error:", err);
    }
};

const clearAllDashboardCaches = async () => {
    try {
        if (redisClient.isOpen) {
            const keys = await redisClient.keys("dashboard_*");
            if (keys && keys.length > 0) {
                await redisClient.del(keys);
            }
        }
    } catch (err) {
        console.error("clearAllDashboardCaches error:", err);
    }
};

module.exports = {
    clearDashboardCache,
    clearAllDashboardCaches
};
