const redisClient = require("../config/redis");

/**
 * Redis Sliding Window Rate Limiter Middleware
 *
 * Algorithm: Sorted Set (ZSET) per key.
 * Each request timestamp is added as a member.
 * Old entries outside the window are pruned on every request.
 * The current count determines whether to allow or deny the request.
 *
 * @param {Object} options
 * @param {number} options.windowMs   - Time window in milliseconds (default: 60000 = 1 min)
 * @param {number} options.max        - Max requests allowed per window (default: 20)
 * @param {string} options.keyPrefix  - Redis key prefix (default: "rl:")
 * @param {string} options.message    - Error message when rate limited
 */
const slidingWindowRateLimit = ({
    windowMs = 60 * 1000,
    max = 20,
    keyPrefix = "rl:",
    message = "Too many requests, please slow down and try again later.",
} = {}) => {
    return async (req, res, next) => {
        // If Redis is not connected, fail open (allow request) to avoid blocking the app
        if (!redisClient.isOpen) {
            console.warn("[RateLimit] Redis not connected — skipping rate limit check.");
            return next();
        }

        // Key: IP address + optional route prefix
        const ip = req.ip || req.connection.remoteAddress || "unknown";
        const key = `${keyPrefix}${ip}`;

        const now = Date.now();
        const windowStart = now - windowMs;

        try {
            // Use a pipeline (multi-exec) for atomic operations
            const results = await redisClient.multi()
                // 1. Remove all entries older than the window start
                .zRemRangeByScore(key, 0, windowStart)
                // 2. Add current request with timestamp as score AND member
                //    (member must be unique: timestamp + random suffix)
                .zAdd(key, [{ score: now, value: `${now}-${Math.random()}` }])
                // 3. Count total entries in window
                .zCard(key)
                // 4. Set key TTL to window (so unused keys auto-expire from Redis)
                .expire(key, Math.ceil(windowMs / 1000))
                .exec();

            // results[2] is the count from zCard
            const requestCount = results[2];

            // Set informational headers
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
            // Fail open on Redis errors — never block legitimate traffic due to infra issues
            console.error("[RateLimit] Redis error:", err.message);
            next();
        }
    };
};

module.exports = slidingWindowRateLimit;
