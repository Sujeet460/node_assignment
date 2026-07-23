import teamService from "../services/teamService.js";
import asyncHandler from "../utils/asyncHandler.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";

const createTeam = asyncHandler(async (req, res) => {
  const team = await teamService.createTeam(req.body);
  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: MESSAGES.TEAM.CREATED,
    data: { team },
  });
});

const getAllTeams = asyncHandler(async (req, res) => {
  const teams = await teamService.getAllTeams(req.user);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Teams retrieved successfully",
    data: { teams },
  });
});

const getTeamById = asyncHandler(async (req, res) => {
  const team = await teamService.getTeamById(req.params.id, req.user);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Team details retrieved successfully",
    data: { team },
  });
});

const updateTeamMembers = asyncHandler(async (req, res) => {
  const team = await teamService.updateTeamMembers(req.params.id, req.body, req.user);
  const actionMessage = req.body.action === "add" ? MESSAGES.TEAM.MEMBER_ADDED : MESSAGES.TEAM.MEMBER_REMOVED;

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: actionMessage,
    data: { team },
  });
});

export { createTeam, getAllTeams, getTeamById, updateTeamMembers };
