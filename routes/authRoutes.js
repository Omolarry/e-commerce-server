const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const { loginCheck, isAuth, isAdmin } = require("../middleware/authMiddleware");

router.post("/isadmin", authController.isAdmin);
router.post("/user", loginCheck, isAuth, isAdmin, authController.allUser);

router.post("/signup", authController.postSignup);
router.post("/signin", authController.postSignin);
router.post("/verify-otp", authController.postVerifyOtp);
router.post("/forgot-password", authController.postForgotPassword);

router.patch("/reset-password/:token", authController.patchResetPassword);


module.exports = router;
