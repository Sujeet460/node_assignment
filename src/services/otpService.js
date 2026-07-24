import otpRepository from "../repositories/otpRepository.js";
import userRepository from "../repositories/userRepository.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { sendOtpEmail, sendConfirmationEmail } from "./emailService.js";
import { userDTO } from "../dto/user.dto.js";

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit random code
};

const sendOtp = async (email) => {
  // Check if user exists first
  const user = await userRepository.findByUsernameOrEmail(email);
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found with this email");
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

  // Save/Update to database
  await otpRepository.createOtp(email, code, expiresAt);

  // Send email asynchronously
  sendOtpEmail(email, code);

  return { email, expiresAt };
};

const verifyOtp = async (email, code) => {
  const validOtp = await otpRepository.findValidOtp(email, code);
  if (!validOtp) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid or expired verification code");
  }

  const user = await userRepository.findByUsernameOrEmail(email);
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "User associated with this email not found");
  }

  // Update user verification status
  user.isVerified = true;
  await user.save();

  // Purge the validated OTP record from DB
  await otpRepository.deleteOtpByEmail(email);

  // Send welcome confirmation email upon successful verification
  sendConfirmationEmail(email, user.username);

  return userDTO(user);
};

export {
  sendOtp,
  verifyOtp,
};
