import authService from "../services/authService.js";
import userService from "../services/userService.js";
import * as otpService from "../services/otpService.js";
import asyncHandler from "../utils/asyncHandler.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body, req.user);
  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: MESSAGES.AUTH.REGISTER_SUCCESS,
    data: { user },
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: MESSAGES.AUTH.LOGIN_SUCCESS,
    data: result,
  });
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  await authService.logout(req.user, req.token, req.tokenExpiry, refreshToken);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: MESSAGES.AUTH.LOGOUT_SUCCESS,
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user._id, req.user);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Profile retrieved successfully",
    data: { user },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refresh(refreshToken);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Tokens refreshed successfully",
    data: result,
  });
});

const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await otpService.sendOtp(email);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "OTP code sent successfully",
    data: result,
  });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const user = await otpService.verifyOtp(email, code);
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Email verified successfully. You can now login.",
    data: { user },
  });
});

export { register, login, logout, getProfile, refresh, sendOtp, verifyOtp };
