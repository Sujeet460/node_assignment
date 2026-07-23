import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log error using Winston logger
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
    stack: err.stack,
    errors: err.errors,
  });

  // Wrap unexpected errors into standard ApiError format
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode ||
      (error.name === "ValidationError" || error.code === 11000
        ? HTTP_STATUS.BAD_REQUEST
        : HTTP_STATUS.INTERNAL_SERVER_ERROR);
        
    let message = error.message || MESSAGES.COMMON.INTERNAL_SERVER_ERROR;
    let errorsList = [];

    // Mongoose schema validation failures
    if (error.name === "ValidationError") {
      message = "Database validation failed";
      errorsList = Object.values(error.errors).map((e) => e.message);
    }

    // MongoDB unique key violations
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      message = `Duplicate field error: The ${field} provided is already registered.`;
      errorsList = [`${field} already exists`];
    }

    error = new ApiError(statusCode, message, errorsList, err.stack);
  }

  return res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors || [],
  });
};

export default errorHandler;
