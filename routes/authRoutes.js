const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();
const restric = require('../middleware/restrict')

router.get('/register', authController.registerPage)
router.post("/register", authController.register);

router.get('/login', authController.login)
router.post("/login", authController.login);

router.get("/dashboard", restric, authController.dashboard);

module.exports = router;
