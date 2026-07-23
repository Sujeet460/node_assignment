import taskService from "../services/taskService.js";
import asyncHandler from "../utils/asyncHandler.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.body, req.user);
  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: MESSAGES.TASK.CREATED,
    data: { task },
  });
});

const getTasks = asyncHandler(async (req, res) => {
  const result = await taskService.getTasks(req.query, req.user);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Tasks retrieved successfully",
    data: result,
  });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.body, req.user);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: MESSAGES.TASK.UPDATED,
    data: { task },
  });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await taskService.deleteTask(req.params.id, req.user);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: MESSAGES.TASK.DELETED,
    data: { task },
  });
});

const assignTask = asyncHandler(async (req, res) => {
  const task = await taskService.assignTask(req.params.id, req.body.assignedTo, req.user);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: MESSAGES.TASK.ASSIGNED,
    data: { task },
  });
});

const getAssignedTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getAssignedTasks(req.user);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Assigned tasks retrieved successfully",
    data: { tasks },
  });
});

export { createTask, getTasks, updateTask, deleteTask, assignTask, getAssignedTasks };
