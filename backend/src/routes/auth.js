const express = require("express");
const router = express.Router();
const { registerUser, loginUser, logoutUser, refreshAccessToken, googleLogin, googleRegister } = require("../controllers/userAuthentication");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/refresh", refreshAccessToken);
router.post("/google-login", googleLogin);
router.post("/google-register", googleRegister);

module.exports = router;
