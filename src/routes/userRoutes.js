import express from "express";
import { getAllUsers, getUserById, updateUserRoleAndTeam } from "../controllers/userController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";
import { apiLimiter } from "../middleware/rateLimiter.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.use(authenticate);
router.use(apiLimiter);

router.get("/", authorizeRoles(ROLES.ADMIN), getAllUsers);
router.get("/:id", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.USER), getUserById);
router.patch("/:id/role", authorizeRoles(ROLES.ADMIN), updateUserRoleAndTeam);

export default router;
