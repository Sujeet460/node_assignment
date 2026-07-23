import express from "express";
import { getStatusCounts, getStatistics } from "../controllers/analyticsController.js";
import { authenticate } from "../middleware/auth.js";
import { apiLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.use(authenticate);
router.use(apiLimiter);

router.get("/status", getStatusCounts);
router.get("/statistics", getStatistics);

export default router;
