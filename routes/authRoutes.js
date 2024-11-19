const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();
const restric = require("../middleware/restrict");

router.get("/register", authController.registerPage);
router.post("/register", authController.register);

router.get("/confirm-email/:token", authController.confirmEmail);

router.get("/login", authController.loginPage);
router.post("/login", authController.login);

router.get("/dashboard", restric, authController.dashboard);

router.get("/logout", authController.logout);

router.get("/forgot-password", authController.forgotPasswordPage);
router.post("/forgot-password", authController.forgotPassword);

router.get("/reset-password/:token", authController.resetPasswordPage);
router.post("/reset-password/:token", authController.resetPassword);

module.exports = router;
