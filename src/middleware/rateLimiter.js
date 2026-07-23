import rateLimit from "express-rate-limit";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

// Rate limiter for authentication endpoints (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "test" ? 1000 : 10,
  message: {
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    next(new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, options.message.message));
  },
});

// General API rate limiter with dynamic role-based thresholds
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    if (req.user) {
      if (req.user.role === "admin") return 1000;
      if (req.user.role === "manager") return 500;
    }
    return 100; // Standard limit
  },
  message: {
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req["ip"];
  },
  validate: { ip: false },
  handler: (req, res, next, options) => {
    next(new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, options.message.message));
  },
});

export { authLimiter, apiLimiter };
