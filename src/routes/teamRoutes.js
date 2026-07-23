import express from "express";
import { createTeam, getAllTeams, getTeamById, updateTeamMembers } from "../controllers/teamController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";
import { apiLimiter } from "../middleware/rateLimiter.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.use(authenticate);
router.use(apiLimiter);

router.post("/", authorizeRoles(ROLES.ADMIN), createTeam);
router.get("/", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), getAllTeams);
router.get("/:id", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), getTeamById);
router.patch("/:id/members", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), updateTeamMembers);

export default router;
