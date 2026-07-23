import jwt from "jsonwebtoken";
import jwtConfig from "../config/jwt.js";
import userRepository from "../repositories/userRepository.js";
import TokenBlacklist from "../models/TokenBlacklist.js";
import * as cacheService from "../services/cacheService.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH.TOKEN_MISSING);
    }

    const token = authHeader.split(" ")[1];

    // Check blacklist cache first, then DB
    const isBlacklistedInCache = await cacheService.get(`blacklist:${token}`);
    if (isBlacklistedInCache) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH.TOKEN_BLACKLISTED);
    }

    const isBlacklistedInDb = await TokenBlacklist.findOne({ token });
    if (isBlacklistedInDb) {
      await cacheService.set(`blacklist:${token}`, true, 3600);
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH.TOKEN_BLACKLISTED);
    }

    const decoded = jwt.verify(token, jwtConfig.secret);
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH.USER_NOT_FOUND);
    }

    req.user = user;
    req.token = token;
    req.tokenExpiry = decoded.exp;
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH.TOKEN_EXPIRED));
    }
    return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH.TOKEN_INVALID));
  }
};

const authenticateOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const isBlacklisted = await TokenBlacklist.findOne({ token });

      if (!isBlacklisted) {
        const decoded = jwt.verify(token, jwtConfig.secret);
        const user = await userRepository.findById(decoded.id);
        if (user) {
          req.user = user;
          req.token = token;
          req.tokenExpiry = decoded.exp;
        }
      }
    }
    next();
  } catch (error) {
    // Fail silently on invalid optional token (allows anonymous users)
    next();
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH.TOKEN_MISSING));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          HTTP_STATUS.FORBIDDEN,
          `Forbidden: Access restricted. Required role: ${roles.join(" or ")}, current: ${req.user.role}`
        )
      );
    }

    next();
  };
};

export { authenticate, authenticateOptional, authorizeRoles };
