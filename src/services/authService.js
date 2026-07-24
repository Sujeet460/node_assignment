import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import jwtConfig from "../config/jwt.js";
import userRepository from "../repositories/userRepository.js";
import TokenBlacklist from "../models/TokenBlacklist.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";
import { ROLES } from "../constants/roles.js";
import { userDTO } from "../dto/user.dto.js";
import * as cacheService from "./cacheService.js";
import { sendConfirmationEmail } from "./emailService.js";
import { sendOtp } from "./otpService.js";

const register = async (userData, caller) => {
  const { username, email, password, role } = userData;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await userRepository.findByUsernameOrEmail(normalizedEmail);
  if (existingUser) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, MESSAGES.AUTH.REGISTRATION_DUPLICATE);
  }

  let finalRole = ROLES.USER;
  if (role && [ROLES.ADMIN, ROLES.MANAGER].includes(role)) {
    if (caller && caller.role === ROLES.ADMIN) {
      finalRole = role;
    } else {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.AUTH.ROLE_ASSIGN_FORBIDDEN);
    }
  }

  const isAdminCreated = caller && caller.role === ROLES.ADMIN;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const newUser = await userRepository.create(
      {
        username,
        email: normalizedEmail,
        password,
        role: finalRole,
        isVerified: isAdminCreated ? true : false,
      },
      session
    );

    await session.commitTransaction();
    session.endSession();

    if (isAdminCreated) {
      sendConfirmationEmail(normalizedEmail, username);
    } else {
      await sendOtp(normalizedEmail);
    }

    return userDTO(newUser);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const login = async (loginData) => {
  const { login, password } = loginData;

  const user = await userRepository.findByUsernameOrEmail(login);
  if (!user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH.INVALID_CREDENTIALS);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH.INVALID_CREDENTIALS);
  }

  if (!user.isVerified) {
    await sendOtp(user.email);
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      "Please verify your email first. A new OTP has been sent."
    );
  }

  const accessToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshExpiresIn }
  );

  user.refreshTokens.push(refreshToken);
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: userDTO(user),
  };
};

const logout = async (user, token, tokenExpiry, refreshToken) => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const ttlSeconds = tokenExpiry - nowSeconds;

  if (ttlSeconds > 0) {
    await cacheService.set(`blacklist:${token}`, true, ttlSeconds);
    const expiresAt = new Date(tokenExpiry * 1000);
    await TokenBlacklist.create({ token, expiresAt });
  }

  if (refreshToken) {
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    await user.save();
  }

  await cacheService.del(`profile:${user._id}`);
};

const refresh = async (refreshTokenVal) => {
  if (!refreshTokenVal) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Refresh token is required");
  }

  try {
    const decoded = jwt.verify(refreshTokenVal, jwtConfig.refreshSecret);
    
    const user = await userRepository.findById(decoded.id);
    if (!user || !user.refreshTokens.includes(refreshTokenVal)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, "Invalid or expired refresh token");
    }

    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    const newRefreshToken = jwt.sign(
      { id: user._id },
      jwtConfig.refreshSecret,
      { expiresIn: jwtConfig.refreshExpiresIn }
    );

    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshTokenVal);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: userDTO(user),
    };
  } catch (error) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, "Invalid or expired refresh token");
  }
};

export default {
  register,
  login,
  logout,
  refresh,
};
