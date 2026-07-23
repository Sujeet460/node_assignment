import Otp from "../models/Otp.js";

const createOtp = async (email, code, expiresAt) => {
  return await Otp.findOneAndUpdate(
    { email: email.toLowerCase() },
    { code, expiresAt },
    { new: true, upsert: true, runValidators: true }
  );
};

const findValidOtp = async (email, code) => {
  const now = new Date();
  return await Otp.findOne({
    email: email.toLowerCase(),
    code,
    expiresAt: { $gt: now },
  });
};

const deleteOtpByEmail = async (email) => {
  return await Otp.deleteMany({ email: email.toLowerCase() });
};

export default {
  createOtp,
  findValidOtp,
  deleteOtpByEmail,
};
