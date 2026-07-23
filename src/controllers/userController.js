import userService from "../services/userService.js";
import asyncHandler from "../utils/asyncHandler.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Users retrieved successfully",
    data: { users },
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id, req.user);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "User details retrieved successfully",
    data: { user },
  });
});

const updateUserRoleAndTeam = asyncHandler(async (req, res) => {
  const user = await userService.updateUserRoleAndTeam(req.params.id, req.body);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "User role and team updated successfully",
    data: { user },
  });
});

export { getAllUsers, getUserById, updateUserRoleAndTeam };
