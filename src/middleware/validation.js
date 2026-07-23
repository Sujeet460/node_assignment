import Joi from "joi";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

// Reusable middleware factory for Joi validation
const validateSchema = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false, // Return all errors, not just the first one
    allowUnknown: true, // Allow unknown properties (like fields express adds)
  });

  if (error) {
    const errorMessages = error.details.map((detail) => `${detail.path.join(".")}: ${detail.message}`);
    return next(new ApiError(HTTP_STATUS.BAD_REQUEST, "Validation failed", errorMessages));
  }

  // Assign sanitized value back to req.body (e.g. lowercase emails, trimmed strings)
  req.body = value;
  next();
};

const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      "string.alphanum": "Username must contain only letters and numbers",
      "string.min": "Username must be between 3 and 30 characters long",
      "string.max": "Username must be between 3 and 30 characters long",
      "any.required": "Username is required",
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),

  password: Joi.string()
    .min(8)
    .pattern(/[a-z]/, "lowercase letter")
    .pattern(/[A-Z]/, "uppercase letter")
    .pattern(/[0-9]/, "number")
    .pattern(/[^a-zA-Z0-9]/, "special character")
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.name": "Password must contain at least one {#name}",
      "any.required": "Password is required",
    }),
});

const loginSchema = Joi.object({
  login: Joi.string().trim().required().messages({
    "any.required": "Username or email is required",
    "string.empty": "Username or email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
    "string.empty": "Password is required",
  }),
});

const taskSchema = Joi.object({
  title: Joi.string().trim().max(100).required().messages({
    "any.required": "Task title is required",
    "string.empty": "Task title cannot be empty",
    "string.max": "Task title cannot exceed 100 characters",
  }),
  description: Joi.string().trim().max(1000).optional().allow("").messages({
    "string.max": "Task description cannot exceed 1000 characters",
  }),
  dueDate: Joi.date().iso().greater("now").required().messages({
    "any.required": "Due date is required",
    "date.format": "Due date must be a valid ISO 8601 date format",
    "date.greater": "Due date must be in the future",
  }),
  priority: Joi.string().valid("low", "medium", "high").optional().messages({
    "any.only": "Priority must be either low, medium, or high",
  }),
  status: Joi.string().valid("pending", "in_progress", "completed").optional().messages({
    "any.only": "Status must be either pending, in_progress, or completed",
  }),
  assignedTo: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .allow(null, "")
    .messages({
      "string.pattern.base": "Invalid User ID for assignedTo",
    }),
});

const taskUpdateSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).optional().messages({
    "string.empty": "Task title cannot be empty",
    "string.max": "Task title cannot exceed 100 characters",
  }),
  description: Joi.string().trim().max(1000).optional().allow(null, "").messages({
    "string.max": "Task description cannot exceed 1000 characters",
  }),
  dueDate: Joi.date().iso().greater("now").optional().messages({
    "date.format": "Due date must be a valid ISO 8601 date format",
    "date.greater": "Due date must be in the future",
  }),
  priority: Joi.string().valid("low", "medium", "high").optional().messages({
    "any.only": "Priority must be either low, medium, or high",
  }),
  status: Joi.string().valid("pending", "in_progress", "completed").optional().messages({
    "any.only": "Status must be either pending, in_progress, or completed",
  }),
  assignedTo: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .allow(null, "")
    .messages({
      "string.pattern.base": "Invalid User ID for assignedTo",
    }),
});

export const registerValidation = validateSchema(registerSchema);
export const loginValidation = validateSchema(loginSchema);
export const taskValidation = validateSchema(taskSchema);
export const taskUpdateValidation = validateSchema(taskUpdateSchema);

const sendOtpSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
  code: Joi.string()
    .length(6)
    .pattern(/^\d+$/)
    .required()
    .messages({
      "string.length": "OTP code must be exactly 6 digits",
      "string.pattern.base": "OTP code must contain only numbers",
      "any.required": "OTP code is required",
    }),
});

export const validateSendOtp = validateSchema(sendOtpSchema);
export const validateVerifyOtp = validateSchema(verifyOtpSchema);
