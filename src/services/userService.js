import userRepository from "../repositories/userRepository.js";
import teamRepository from "../repositories/teamRepository.js";
import { userDTO, userListDTO } from "../dto/user.dto.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";
import { ROLES } from "../constants/roles.js";
import mongoose from "mongoose";
import * as cacheService from "./cacheService.js";
import { getPaginationOptions, formatPaginationResponse } from "../utils/pagination.js";

const getAllUsers = async (queryParams) => {
  const { page, limit, skip } = getPaginationOptions(queryParams);
  const { users, total } = await userRepository.findAndCount(skip, limit);

  return {
    users: userListDTO(users),
    pagination: formatPaginationResponse(total, page, limit),
  };
};

const getUserById = async (id, currentUser) => {
  const user = await userRepository.findById(id, true);
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
  }

  // Role check: Managers see only their team members; standard users see only themselves
  if (currentUser.role === ROLES.MANAGER) {
    const managerTeam = await teamRepository.findByManager(currentUser._id);
    if (!managerTeam || !user.team || managerTeam._id.toString() !== user.team._id.toString()) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.TEAM.NOT_MANAGER);
    }
  } else if (currentUser.role !== ROLES.ADMIN && currentUser._id.toString() !== id.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.COMMON.FORBIDDEN);
  }

  return userDTO(user);
};

const updateUserRoleAndTeam = async (id, updateData) => {
  const { role, teamId } = updateData;

  const user = await userRepository.findById(id);
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
  }

  await cacheService.del(`profile:${id}`);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const dbUpdates = {};

    if (role) {
      if (!Object.values(ROLES).includes(role)) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid role specified");
      }
      dbUpdates.role = role;
    }

    if (teamId !== undefined) {
      const oldTeamId = user.team;

      if (teamId === null || teamId === "") {
        if (oldTeamId) {
          await teamRepository.pullMember(oldTeamId, id, session);
        }
        dbUpdates.team = null;
      } else {
        const newTeam = await teamRepository.findById(teamId);
        if (!newTeam) {
          throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.TEAM.NOT_FOUND);
        }

        if (oldTeamId && oldTeamId.toString() !== teamId) {
          await teamRepository.pullMember(oldTeamId, id, session);
        }

        await teamRepository.pushMember(teamId, id, session);
        dbUpdates.team = teamId;
      }
    }

    await userRepository.update(id, dbUpdates, session);

    await session.commitTransaction();
    session.endSession();

    const populatedUser = await userRepository.findById(id, true);
    return userDTO(populatedUser);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export default {
  getAllUsers,
  getUserById,
  updateUserRoleAndTeam,
};
