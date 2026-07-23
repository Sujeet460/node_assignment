import express from "express";
import { createTask, getTasks, updateTask, deleteTask, assignTask, getAssignedTasks } from "../controllers/taskController.js";
import { authenticate } from "../middleware/auth.js";
import { apiLimiter } from "../middleware/rateLimiter.js";
import { taskValidation, taskUpdateValidation } from "../middleware/validation.js";

const router = express.Router();

router.use(authenticate);
router.use(apiLimiter);

router.post("/", taskValidation, createTask);
router.get("/", getTasks);
router.get("/assigned", getAssignedTasks); // Placed before /:id to prevent ID matching collision
router.put("/:id", taskUpdateValidation, updateTask);
router.delete("/:id", deleteTask);
router.patch("/:id/assign", assignTask);

export default router;
