export default {
  secret: process.env.JWT_SECRET || "super_secret_access_key",
  expiresIn: process.env.JWT_EXPIRES_IN || "15m", // Access Token short expiry (15 min)
  refreshSecret: process.env.REFRESH_JWT_SECRET || `${process.env.JWT_SECRET || "super_secret_access_key"}_refresh`,
  refreshExpiresIn: process.env.REFRESH_JWT_EXPIRES_IN || "7d", // Refresh Token long expiry (7 days)
};
