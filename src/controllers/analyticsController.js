import analyticsService from "../services/analyticsService.js";
import asyncHandler from "../utils/asyncHandler.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

const getStatusCounts = asyncHandler(async (req, res) => {
  const result = await analyticsService.getStatusCounts(req.user);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Task status distribution counts calculated successfully",
    data: result,
  });
});

const getStatistics = asyncHandler(async (req, res) => {
  const result = await analyticsService.getStatistics(req.user);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Task completion statistics calculated successfully",
    data: result,
  });
});

export { getStatusCounts, getStatistics };
