const redisClient = require("../config/redis");

const slidingWindowRateLimit = ({
    windowMs = 60 * 1000,
    max = 100,
    keyPrefix = "rl:",
    message = "Too many requests, please slow down and try again later.",
} = {}) => {
    return async (req, res, next) => {
        if (!redisClient.isOpen) {
            console.error("[RateLimit] Security error: Redis server is offline.");
            return res.status(503).json({
                success: false,
                message: "Security service temporarily unavailable. System protection requires active cache services.",
            });
        }

        // Key: IP address + optional route prefix
        const ip = req.ip || req.connection.remoteAddress || "unknown";
        const key = `${keyPrefix}${ip}`;

        const now = Date.now();
        const windowStart = now - windowMs;

        try {
            // Use a pipeline (multi-exec) for atomic operations
            const results = await redisClient.multi()

                .zRemRangeByScore(key, 0, windowStart)

                .zAdd(key, [{ score: now, value: `${now}-${Math.random()}` }])

                .zCard(key)
                .expire(key, Math.ceil(windowMs / 1000))
                .exec();

            // results[2] is the count from zCard
            const requestCount = results[2];

            res.setHeader("X-RateLimit-Limit", max);
            res.setHeader("X-RateLimit-Remaining", Math.max(0, max - requestCount));
            res.setHeader("X-RateLimit-Window-Ms", windowMs);

            if (requestCount > max) {
                res.setHeader("Retry-After", Math.ceil(windowMs / 1000));
                return res.status(429).json({
                    success: false,
                    message,
                    retryAfterSeconds: Math.ceil(windowMs / 1000),
                });
            }

            next();
        } catch (err) {
            console.error("[RateLimit] Redis error:", err.message);
            return res.status(503).json({
                success: false,
                message: "Security rate-limiter service unavailable. Request blocked for system protection.",
            });
        }
    };
};

module.exports = slidingWindowRateLimit;
