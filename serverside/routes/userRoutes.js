const express = require("express");

const userController = require("../controllers/userController");
const isAuthenticated = require("../middlewares/auth");

const router = express.Router();

router.post("/registerValidation", userController.registerValidation);
router.post("/sendOtp", userController.sendOtp);
router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/profile", isAuthenticated, userController.userProfile);
router.post("/logout", isAuthenticated, userController.logout);
router.put("/updateUsername", isAuthenticated, userController.updateUsername);
router.delete("/deleteAccount", isAuthenticated, userController.deleteAccount);
router.post("/setResetPasswordToken", userController.setResetPasswordToken);
router.post("/verifyEmail", isAuthenticated, userController.verifyEmail);
router.post("/forgotPassword", userController.forgotPassword);
router.post("/verifyForgotPasswordOtp", userController.verifyForgotPasswordOtp);
router.post("/verifyPassword", isAuthenticated, userController.verifyPassword);
router.put("/changePassword", userController.changePassword);
router.post("/userValid", userController.userValid);

module.exports = router;
