const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");
const env = require("../config/env");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(env.googleClientId);

async function verifyGoogleToken(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: env.googleClientId,
    });
    return ticket.getPayload();
}

async function blacklistTokens(req) {
    const { accessToken, refreshToken } = req.cookies || {};
    if (accessToken) {
        try {
            const decodedAccess = jwt.verify(accessToken, env.jwtAccessSecret);
            if (redisClient.isOpen) {
                await redisClient.set(`blacklist:${accessToken}`, "blocked");
                await redisClient.expireAt(`blacklist:${accessToken}`, decodedAccess.exp);
            }
        } catch (err) {}
    }
    if (refreshToken) {
        try {
            const decodedRefresh = jwt.verify(refreshToken, env.jwtRefreshSecret);
            if (redisClient.isOpen) {
                await redisClient.set(`blacklist:${refreshToken}`, "blocked");
                await redisClient.expireAt(`blacklist:${refreshToken}`, decodedRefresh.exp);
            }
        } catch (err) {}
    }
}

function generateTokens(payload) {
    const accessToken = jwt.sign(payload, env.jwtAccessSecret, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: "7d" });
    return { accessToken, refreshToken };
}

function setTokenCookies(res, accessToken, refreshToken) {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/auth",
    });
}

function clearTokenCookies(res) {
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    });

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/auth"
    });
}

module.exports = {
    verifyGoogleToken,
    blacklistTokens,
    generateTokens,
    setTokenCookies,
    clearTokenCookies
};
