import taskRepository from "../repositories/taskRepository.js";
import teamRepository from "../repositories/teamRepository.js";
import { ROLES } from "../constants/roles.js";
import * as cacheService from "./cacheService.js";

const getFilterQueryForRole = async (user) => {
  let filterQuery = {};
  if (user.role === ROLES.ADMIN) {
    // Admins see all tasks
  } else if (user.role === ROLES.MANAGER) {
    const managerTeam = await teamRepository.findByManager(user._id);
    const teamId = managerTeam ? managerTeam._id : null;

    filterQuery.$or = [
      { createdBy: user._id },
      { assignedTo: user._id },
      ...(teamId ? [{ team: teamId }] : []),
    ];
  } else {
    filterQuery.$or = [
      { createdBy: user._id },
      { assignedTo: user._id },
    ];
  }
  return filterQuery;
};

const getStatusCounts = async (currentUser) => {
  const userId = currentUser._id;
  const cacheKey = `analytics:status:user:${userId}:role:${currentUser.role}`;

  const cachedStats = await cacheService.get(cacheKey);
  if (cachedStats) return cachedStats;

  const filterQuery = await getFilterQueryForRole(currentUser);
  const now = new Date();

  const statusCounts = await taskRepository.aggregate([
    { $match: filterQuery },
    {
      $group: {
        _id: null,
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        pending: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ["$status", ["pending", "in_progress"]] },
                  { $gte: ["$dueDate", now] },
                ],
              },
              1,
              0,
            ],
          },
        },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$status", "completed"] },
                  { $lt: ["$dueDate", now] },
                ],
              },
              1,
              0,
            ],
          },
        },
        total: { $sum: 1 },
      },
    },
  ]);

  const result = statusCounts[0] || {
    completed: 0,
    pending: 0,
    overdue: 0,
    total: 0,
  };

  delete result._id;

  await cacheService.set(cacheKey, result, 300);
  return result;
};

const getStatistics = async (currentUser) => {
  const userId = currentUser._id;
  const cacheKey = `analytics:statistics:user:${userId}:role:${currentUser.role}`;

  const cachedStats = await cacheService.get(cacheKey);
  if (cachedStats) return cachedStats;

  const filterQuery = await getFilterQueryForRole(currentUser);
  const now = new Date();

  const userStats = await taskRepository.aggregate([
    { $match: filterQuery },
    {
      $group: {
        _id: "$assignedTo",
        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        pending: {
          $sum: {
            $cond: [
              { $and: [{ $in: ["$status", ["pending", "in_progress"]] }, { $gte: ["$dueDate", now] }] },
              1,
              0,
            ],
          },
        },
        overdue: {
          $sum: {
            $cond: [
              { $and: [{ $ne: ["$status", "completed"] }, { $lt: ["$dueDate", now] }] },
              1,
              0,
            ],
          },
        },
        total: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        userId: "$_id",
        username: { $ifNull: ["$user.username", "Unassigned"] },
        email: { $ifNull: ["$user.email", "N/A"] },
        completed: 1,
        pending: 1,
        overdue: 1,
        total: 1,
        _id: 0,
      },
    },
  ]);

  const teamStats = await taskRepository.aggregate([
    { $match: filterQuery },
    { $match: { team: { $ne: null } } },
    {
      $group: {
        _id: "$team",
        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        pending: {
          $sum: {
            $cond: [
              { $and: [{ $in: ["$status", ["pending", "in_progress"]] }, { $gte: ["$dueDate", now] }] },
              1,
              0,
            ],
          },
        },
        overdue: {
          $sum: {
            $cond: [
              { $and: [{ $ne: ["$status", "completed"] }, { $lt: ["$dueDate", now] }] },
              1,
              0,
            ],
          },
        },
        total: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "teams",
        localField: "_id",
        foreignField: "_id",
        as: "team",
      },
    },
    { $unwind: "$team" },
    {
      $project: {
        teamId: "$_id",
        teamName: "$team.name",
        completed: 1,
        pending: 1,
        overdue: 1,
        total: 1,
        _id: 0,
      },
    },
  ]);

  const result = {
    byUser: userStats,
    byTeam: teamStats,
  };

  await cacheService.set(cacheKey, result, 300);
  return result;
};

export default {
  getFilterQueryForRole,
  getStatusCounts,
  getStatistics,
};
