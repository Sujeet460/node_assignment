import taskRepository from "../repositories/taskRepository.js";
import userRepository from "../repositories/userRepository.js";
import teamRepository from "../repositories/teamRepository.js";
import Task from "../models/Task.js";
import { taskDTO, taskListDTO } from "../dto/task.dto.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";
import { ROLES } from "../constants/roles.js";
import { getPaginationOptions, formatPaginationResponse } from "../utils/pagination.js";
import * as socketService from "./socketService.js";
import * as cacheService from "./cacheService.js";

const createTask = async (taskData, currentUser) => {
  const { title, description, dueDate, priority, status, assignedTo } = taskData;
  const creatorId = currentUser._id;
  let targetTeamId = null;

  if (assignedTo) {
    const assignedUser = await userRepository.findById(assignedTo);
    if (!assignedUser) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Assigned user not found");
    }

    if (currentUser.role === ROLES.MANAGER) {
      const managerTeam = await teamRepository.findByManager(creatorId);
      if (!managerTeam || !managerTeam.members.includes(assignedTo)) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.TASK.ASSIGN_FORBIDDEN_MANAGER);
      }
      targetTeamId = managerTeam._id;
    } else if (currentUser.role === ROLES.USER) {
      if (assignedTo.toString() !== creatorId.toString()) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.TASK.ASSIGN_FORBIDDEN_USER);
      }
      targetTeamId = currentUser.team;
    } else {
      targetTeamId = assignedUser.team;
    }
  } else {
    if (currentUser.role === ROLES.MANAGER) {
      const managerTeam = await teamRepository.findByManager(creatorId);
      if (managerTeam) targetTeamId = managerTeam._id;
    } else {
      targetTeamId = currentUser.team;
    }
  }

  const task = await taskRepository.create({
    title,
    description,
    dueDate,
    priority,
    status,
    assignedTo: assignedTo || null,
    createdBy: creatorId,
    team: targetTeamId,
  });

  await cacheService.flush();

  const populatedTask = await taskRepository.findById(task._id);
  const eventData = { action: "create", task: taskDTO(populatedTask) };
  if (assignedTo) {
    socketService.notifyUser(assignedTo, "task_changed", eventData);
  }
  if (targetTeamId) {
    socketService.notifyTeam(targetTeamId, "task_changed", eventData);
  }
  socketService.broadcast("task_changed", eventData);

  return taskDTO(populatedTask);
};

const getTasks = async (queryParams, currentUser) => {
  const { status, priority, dueDate, search, sortBy } = queryParams;
  const { page, limit, skip } = getPaginationOptions(queryParams);
  const userId = currentUser._id;

  const cacheKey = `tasks:user:${userId}:role:${currentUser.role}:query:${JSON.stringify(queryParams)}`;
  const cachedTasks = await cacheService.get(cacheKey);
  if (cachedTasks) return cachedTasks;

  let filterQuery = {};

  if (currentUser.role === ROLES.ADMIN) {
    // Admins see all
  } else if (currentUser.role === ROLES.MANAGER) {
    const managerTeam = await teamRepository.findByManager(userId);
    const teamId = managerTeam ? managerTeam._id : null;

    filterQuery.$or = [
      { createdBy: userId },
      { assignedTo: userId },
      ...(teamId ? [{ team: teamId }] : []),
    ];
  } else {
    filterQuery.$or = [
      { createdBy: userId },
      { assignedTo: userId },
    ];
  }

  if (status) filterQuery.status = status;
  if (priority) filterQuery.priority = priority;
  if (dueDate) {
    const startOfDay = new Date(dueDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(dueDate);
    endOfDay.setUTCHours(23, 59, 59, 999);
    filterQuery.dueDate = { $gte: startOfDay, $lte: endOfDay };
  }

  if (search) {
    const regex = new RegExp(search, "i");
    filterQuery.$and = filterQuery.$and || [];
    filterQuery.$and.push({
      $or: [
        { title: { $regex: regex } },
        { description: { $regex: regex } },
      ],
    });
  }

  let sortOption = { createdAt: -1 };
  if (sortBy) {
    const parts = sortBy.split(":");
    sortOption = { [parts[0]]: parts[1] === "desc" ? -1 : 1 };
  }

  const { tasks, total } = await taskRepository.findAndCount(filterQuery, sortOption, skip, limit);
  const pagination = formatPaginationResponse(total, page, limit);

  const responseData = {
    tasks: taskListDTO(tasks),
    pagination,
  };

  await cacheService.set(cacheKey, responseData, 300);
  return responseData;
};

const updateTask = async (id, updateData, currentUser) => {
  const userId = currentUser._id;

  const task = await taskRepository.findById(id);
  if (!task) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.TASK.NOT_FOUND);
  }

  const isCreator = task.createdBy._id.toString() === userId.toString();
  const isAssigned = task.assignedTo && task.assignedTo._id.toString() === userId.toString();

  let isTeamManager = false;
  if (currentUser.role === ROLES.MANAGER) {
    const managerTeam = await teamRepository.findByManager(userId);
    if (managerTeam && task.team && managerTeam._id.toString() === task.team._id.toString()) {
      isTeamManager = true;
    }
  }

  const hasAccess = currentUser.role === ROLES.ADMIN || isCreator || isAssigned || isTeamManager;
  if (!hasAccess) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.TASK.MODIFY_FORBIDDEN);
  }

  const updates = {};
  const { title, description, dueDate, priority, status, assignedTo } = updateData;

  if (currentUser.role === ROLES.USER && isAssigned && !isCreator) {
    if (status) {
      updates.status = status;
    } else {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.TASK.USER_MODIFY_FORBIDDEN);
    }
  } else {
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (dueDate) updates.dueDate = dueDate;
    if (priority) updates.priority = priority;
    if (status) updates.status = status;

    if (assignedTo !== undefined) {
      if (assignedTo === null || assignedTo === "") {
        updates.assignedTo = null;
      } else {
        const assignedUser = await userRepository.findById(assignedTo);
        if (!assignedUser) {
          throw new ApiError(HTTP_STATUS.NOT_FOUND, "Assigned user not found");
        }

        if (currentUser.role === ROLES.MANAGER) {
          const managerTeam = await teamRepository.findByManager(userId);
          if (!managerTeam || !managerTeam.members.includes(assignedTo)) {
            throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.TASK.ASSIGN_FORBIDDEN_MANAGER);
          }
        }

        updates.assignedTo = assignedTo;
        updates.team = assignedUser.team;
      }
    }
  }

  await taskRepository.update(id, updates);
  await cacheService.flush();

  const populatedTask = await taskRepository.findById(id);
  const eventData = { action: "update", task: taskDTO(populatedTask) };
  if (populatedTask.assignedTo) {
    socketService.notifyUser(populatedTask.assignedTo._id, "task_changed", eventData);
  }
  if (populatedTask.team) {
    socketService.notifyTeam(populatedTask.team._id, "task_changed", eventData);
  }
  socketService.broadcast("task_changed", eventData);

  return taskDTO(populatedTask);
};

const deleteTask = async (id, currentUser) => {
  const userId = currentUser._id;
  const task = await taskRepository.findById(id);
  if (!task) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.TASK.NOT_FOUND);
  }

  const isCreator = task.createdBy._id.toString() === userId.toString();
  let isTeamManager = false;
  if (currentUser.role === ROLES.MANAGER) {
    const managerTeam = await teamRepository.findByManager(userId);
    if (managerTeam && task.team && managerTeam._id.toString() === task.team._id.toString()) {
      isTeamManager = true;
    }
  }

  const hasAccess = currentUser.role === ROLES.ADMIN || isCreator || isTeamManager;
  if (!hasAccess) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.TASK.DELETE_FORBIDDEN);
  }

  await taskRepository.delete(id); // Safe call to mapped key
  await cacheService.flush();

  const eventData = { action: "delete", taskId: id };
  if (task.assignedTo) {
    socketService.notifyUser(task.assignedTo._id, "task_changed", eventData);
  }
  if (task.team) {
    socketService.notifyTeam(task.team._id, "task_changed", eventData);
  }
  socketService.broadcast("task_changed", eventData);

  return taskDTO(task);
};

const assignTask = async (id, assignedTo, currentUser) => {
  const userId = currentUser._id;
  const task = await taskRepository.findById(id);
  if (!task) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.TASK.NOT_FOUND);
  }

  if (task.assignedTo) {
    const currentAssigneeId = task.assignedTo._id 
      ? task.assignedTo._id.toString() 
      : task.assignedTo.toString();
    if (currentAssigneeId === assignedTo.toString()) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, MESSAGES.TASK.ALREADY_ASSIGNED);
    }
  }

  const assignee = await userRepository.findById(assignedTo);
  if (!assignee) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "User to assign not found");
  }

  if (currentUser.role === ROLES.MANAGER) {
    const managerTeam = await teamRepository.findByManager(userId);
    if (!managerTeam || !managerTeam.members.includes(assignedTo)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.TASK.ASSIGN_FORBIDDEN_MANAGER);
    }
  } else if (currentUser.role !== ROLES.ADMIN) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, "Forbidden: Only Managers or Admins can assign tasks");
  }

  await taskRepository.update(id, {
    assignedTo,
    team: assignee.team || null,
  });

  await cacheService.flush();

  const populatedTask = await taskRepository.findById(id);
  const eventData = { action: "assign", task: taskDTO(populatedTask) };
  socketService.notifyUser(assignedTo, "task_changed", eventData);
  if (populatedTask.team) {
    socketService.notifyTeam(populatedTask.team._id, "task_changed", eventData);
  }
  socketService.broadcast("task_changed", eventData);

  return taskDTO(populatedTask);
};

const getAssignedTasks = async (currentUser) => {
  const userId = currentUser._id;
  const cacheKey = `tasks:assigned:user:${userId}`;

  const cachedTasks = await cacheService.get(cacheKey);
  if (cachedTasks) return cachedTasks;

  const tasks = await Task.find({ assignedTo: userId })
    .populate("createdBy", "username email")
    .populate("team", "name");

  const mapped = taskListDTO(tasks);
  await cacheService.set(cacheKey, mapped, 300);
  return mapped;
};

export default {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  assignTask,
  getAssignedTasks,
};
