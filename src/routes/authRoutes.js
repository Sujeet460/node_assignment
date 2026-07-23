import express from "express";
import {
  register,
  login,
  logout,
  getProfile,
  refresh,
  sendOtp,
  verifyOtp,
} from "../controllers/authController.js";
import { authenticate, authenticateOptional } from "../middleware/auth.js";
import { authLimiter, apiLimiter } from "../middleware/rateLimiter.js";
import {
  registerValidation,
  loginValidation,
  validateSendOtp,
  validateVerifyOtp,
} from "../middleware/validation.js";

const router = express.Router();

// Mount authenticateOptional before register so req.user is loaded for role validations
router.post("/register", authLimiter, authenticateOptional, registerValidation, register);
router.post("/login", authLimiter, loginValidation, login);
router.post("/logout", authenticate, logout);
router.get("/profile", authenticate, apiLimiter, getProfile);
router.post("/refresh", authLimiter, refresh); // Token rotation endpoint

// OTP verification and sending routes
router.post("/send-otp", authLimiter, validateSendOtp, sendOtp);
router.post("/verify-otp", authLimiter, validateVerifyOtp, verifyOtp);

export default router;
