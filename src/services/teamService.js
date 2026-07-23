import teamRepository from "../repositories/teamRepository.js";
import userRepository from "../repositories/userRepository.js";
import { teamDTO, teamListDTO } from "../dto/team.dto.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";
import { ROLES } from "../constants/roles.js";
import mongoose from "mongoose";
import * as cacheService from "./cacheService.js";

const createTeam = async (teamData) => {
  const { name, managerId } = teamData;

  const manager = await userRepository.findById(managerId);
  if (!manager) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.TEAM.MANAGER_NOT_FOUND);
  }
  if (manager.role !== ROLES.MANAGER && manager.role !== ROLES.ADMIN) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, MESSAGES.TEAM.INVALID_MANAGER_ROLE);
  }

  const existingTeam = await teamRepository.findByName(name);
  if (existingTeam) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, MESSAGES.TEAM.DUPLICATE_NAME);
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const team = await teamRepository.create(
      {
        name,
        manager: managerId,
        members: [managerId],
      },
      session
    );

    await userRepository.update(managerId, { team: team._id }, session);

    await session.commitTransaction();
    session.endSession();

    await cacheService.del(`profile:${managerId}`);

    const populatedTeam = await teamRepository.findById(team._id);
    return teamDTO(populatedTeam);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getAllTeams = async (currentUser) => {
  let teams;
  if (currentUser.role === ROLES.ADMIN) {
    teams = await teamRepository.findAll();
  } else if (currentUser.role === ROLES.MANAGER) {
    teams = await teamRepository.findAll({ manager: currentUser._id });
  } else {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.COMMON.FORBIDDEN);
  }
  return teamListDTO(teams);
};

const getTeamById = async (id, currentUser) => {
  const team = await teamRepository.findById(id);
  if (!team) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.TEAM.NOT_FOUND);
  }

  if (currentUser.role !== ROLES.ADMIN && team.manager._id.toString() !== currentUser._id.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.TEAM.NOT_MANAGER);
  }

  return teamDTO(team);
};

const updateTeamMembers = async (id, memberData, currentUser) => {
  const { action, userId } = memberData;

  const team = await teamRepository.findById(id);
  if (!team) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.TEAM.NOT_FOUND);
  }

  if (currentUser.role !== ROLES.ADMIN && team.manager._id.toString() !== currentUser._id.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.TEAM.NOT_MANAGER);
  }

  const targetUser = await userRepository.findById(userId);
  if (!targetUser) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.TEAM.USER_NOT_FOUND);
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (action === "add") {
      const isMember = team.members.some((m) => m._id.toString() === userId);
      if (isMember) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, MESSAGES.TEAM.ALREADY_MEMBER);
      }

      if (targetUser.team && targetUser.team.toString() !== id) {
        await teamRepository.pullMember(targetUser.team, userId, session);
      }

      await teamRepository.pushMember(id, userId, session);
      await userRepository.update(userId, { team: id }, session);
    } else if (action === "remove") {
      if (team.manager._id.toString() === userId) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, MESSAGES.TEAM.REMOVE_MANAGER_FORBIDDEN);
      }

      const isMember = team.members.some((m) => m._id.toString() === userId);
      if (!isMember) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, MESSAGES.TEAM.NOT_MEMBER);
      }

      await teamRepository.pullMember(id, userId, session);
      await userRepository.update(userId, { team: null }, session);
    } else {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid action. Must be 'add' or 'remove'");
    }

    await session.commitTransaction();
    session.endSession();

    await cacheService.del(`profile:${userId}`);

    const updatedTeam = await teamRepository.findById(id);
    return teamDTO(updatedTeam);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export default {
  createTeam,
  getAllTeams,
  getTeamById,
  updateTeamMembers,
};
